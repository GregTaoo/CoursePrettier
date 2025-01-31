"""
API 异常基类。
"""


class ApiException(Exception):
    """
    API 基类异常。
    """

    def __init__(self, msg: str = "出现了错误，但是未说明具体原因。"):
        super().__init__(msg)
        self.msg = msg

    def __str__(self):
        return self.msg


class FailToLogin(ApiException):
    def __init__(self, api_name: str, msg: str = "登陆{}时失败"):
        self.msg = msg.format(api_name)
        super().__init__(self.msg)


class UsernameOrPasswordError(ApiException):
    """
    Credential 类登录失败时的异常。
    """

    def __init__(self):
        super().__init__("用户名或密码错误")


class InvalidRemoteResponse(ApiException):
    """
    接口返回的数据不是期望的数据类型。
    """

    def __init__(self, api_name: str, excepted: str, msg: str = "接口{}返回的数据不是期望的数据类型, 期望: {}"):
        self.msg = msg.format(api_name, excepted)
        super().__init__(self.msg)

class SessionExpiredError(ApiException):
    """
    登录失效
    """

    def __init__(self):
        super().__init__('登录失效')