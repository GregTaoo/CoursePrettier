import asyncio
import base64
import pickle
import random
from typing import Tuple

import aiohttp
from Crypto.Cipher import AES
from Crypto.Util import Padding
from aiohttp import ClientSession, CookieJar, TCPConnector
from aiohttp.resolver import AsyncResolver
from bs4 import BeautifulSoup

from IDS.Exception import UsernameOrPasswordError

NAMESERVERS = ["8.8.8.8", "8.8.4.4"]

class LoginToken:
    def __init__(self, soup: BeautifulSoup):
        self.captcha = ""
        self.lt = soup.find(lambda tag: tag.get("name") == "lt")["value"]
        self.cllt = "userNameLogin"
        self.dllt = soup.find(lambda tag: tag.get("name") == "dllt")["value"]
        self.execution = soup.find(lambda tag: tag.get("name") == "execution")["value"]
        self.event_id = soup.find(lambda tag: tag.get("name") == "_eventId")["value"]


class Credential:
    """
    凭据基类，用于各种请求操作的验证，由ids系统产生。
    """

    def __init__(self, student_id: str, cookie_jar_bytes: bytes = None):
        """
        Credential 构造函数，初始化 aiohttp 客户端
        """
        self.is_login = False
        self.student_id = student_id
        if cookie_jar_bytes is None:
            cookie_jar = None
        else:
            cookie_jar = CookieJar(loop=asyncio.get_event_loop())
            cookie_jar._cookies = pickle.loads(cookie_jar_bytes)
        resolver = AsyncResolver(nameservers=NAMESERVERS)
        connector = TCPConnector(resolver=resolver)
        self.session: ClientSession = aiohttp.ClientSession(
            headers={ 'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"},
            cookie_jar=cookie_jar,
            connector=connector
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *err):
        await self.close()

    async def close(self):
        if self.session is not None:
            if self.is_login:
                await self.session.get("https://egate.shanghaitech.edu.cn/logout")
            await self.session.close()
            self.session = None
            self.is_login = False

    def logged_in(self) -> bool:
        """
        是否登录。
        Returns:
            bool。
        """
        return self.is_login

    async def get_login_token(self) -> Tuple[str, LoginToken]:
        async with self.session.get('https://ids.shanghaitech.edu.cn/authserver/login') as response:
            soup = BeautifulSoup(await response.read(), 'html.parser')
            pwd_encrypt_salt = soup.find(lambda tag: tag.get("id") == "pwdEncryptSalt")["value"]
            token = LoginToken(soup)
            return pwd_encrypt_salt, token

    async def login(self, password: str):
        (pwd_default_encrypt_salt, token) = await self.get_login_token()
        password = encode_password(password, pwd_default_encrypt_salt)
        await self.run_two_step_login(token, password)

    async def get_two_step_login_data(self) -> Tuple[str, LoginToken, bytes]:
        (pwd_encrypt_salt, token) = await self.get_login_token()
        old_class = self.session.cookie_jar.__class__
        self.session.cookie_jar.__class__ = CookieJar
        result = (pwd_encrypt_salt, token, pickle.dumps(self.session.cookie_jar._cookies, pickle.HIGHEST_PROTOCOL))
        self.session.cookie_jar.__class__ = old_class
        return result

    async def run_two_step_login(self, token: LoginToken, encoded_password: str):
        data = {
            "username": self.student_id,
            "password": encoded_password,
            "captcha": token.captcha,
            "lt": token.lt,
            "cllt": token.cllt,
            "dllt": token.dllt,
            "execution": token.execution,
            "_eventId": token.event_id,
        }
        async with self.session.post("https://ids.shanghaitech.edu.cn/authserver/login", data=data):
            cookies = list(self.session.cookie_jar)
            if len(list(filter(lambda cookie: cookie.key == 'CASTGC', cookies))) == 0:
                raise UsernameOrPasswordError()
            else:
                self.is_login = True


def encode_password(password: str, salt: str) -> str:
    """
    将 https://ids.shanghaitech.edu.cn/authserver/custom/js/encrypt.js 翻译为 python
    """

    def random_str(str_len: int):
        chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
        return ''.join(random.choice(chars) for _ in range(str_len))

    iv = random_str(16).encode('utf-8')
    cipher = AES.new(salt.encode('utf-8'), AES.MODE_CBC, iv)
    password = random_str(64) + password
    password = Padding.pad(password.encode('utf-8'), 16)
    return base64.b64encode(cipher.encrypt(password)).decode('ascii')
