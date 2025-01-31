import re

from aiohttp import ClientSession
from bs4 import BeautifulSoup

from IDS.Credential import Credential
from IDS.Exception import SessionExpiredError

URL = 'https://eams.shanghaitech.edu.cn/eams/'

class Eams:
    """
    Eams 类, 用于进行各种 Eams 操作
    """

    def __init__(self, credential: Credential):
        """
        Eams 类 构造函数
        """
        self.is_login = False
        self.session: ClientSession = credential.session
        self.credential: Credential = credential

    async def login(self):
        # content = await self.get('https://ids.shanghaitech.edu.cn/authserver/login')
        # content = content.decode('utf-8')
        # if content.find('注 销') == -1:
        #     print(content)
        #     raise FailToLogin("Eams")
        # else:
        self.is_login = True

    async def get(self, url):
        async with self.session.get(URL + url) as response:
            content = await response.read()
            return content

    async def post(self, url, payload):
        async with self.session.post(URL + url, data=payload) as response:
            content = await response.read()
            return content

    @staticmethod
    def find_table_id(soup: BeautifulSoup) -> str:
        script_tags = soup.find_all('script')
        for tag in script_tags:
            match = re.search("bg.form.addInput\(form,\"ids\",\"\d+\"\)", tag.text)
            if match:
                return match.group(0).split('"')[-2]
        raise ValueError("Cannot find table id")

    async def get_semesters(self) -> tuple[dict, str, str]:
        text = (await self.get("courseTableForStd.action")).decode("utf-8")
        print(text)
        if text.find('统一身份认证') > 0:
            raise SessionExpiredError()
        mystery_id = text.split('"></div>')[0][-11:]
        default_semester = re.findall(r'\{empty:"false",value:"(\d+)"},"searchTable\(\)"\);', text)[0]
        table_id = self.find_table_id(BeautifulSoup(text, 'html.parser'))
        text = (await self.post('dataQuery.action', {
            'tagId': f'semesterBar{mystery_id}Semester',
            'dataType': 'semesterCalendar',
            'value': 6,
            'empty': False
        })).decode("utf-8")
        matches = re.findall(r'\{id:(\d+),schoolYear:"(\d+-\d+)",name:"(.*?)"}', text)
        semesters = {}
        for value in matches:
            if value[1] in semesters:
                semesters[value[1]][value[2]] = value[0]
            else:
                semesters[value[1]] = {
                    value[2]: value[0]
                }
        return semesters, default_semester, table_id

    async def get_course_table(self, semester_id: str, table_id: str = None, start_week: int = None) -> dict:
        if table_id is None:
            text = (await self.get("courseTableForStd.action")).decode("utf-8")
            if text.find('统一身份认证') > 0:
                raise SessionExpiredError()
            table_id = self.find_table_id(BeautifulSoup(text, 'html.parser'))
        text = (await self.post(f"courseTableForStd!courseTable.action?ignoreHead=1&setting.kind=std&startWeek={start_week if start_week else ''}&semester.id={semester_id}&ids={table_id}&tutorRedirectstudentId={table_id}", {})).decode('utf-8')
        if text.find('统一身份认证') > 0:
            raise SessionExpiredError()
        course_strs = text.split('var teachers')
        match_periods = re.findall(r'<br>\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*</font>', course_strs[0])
        periods = []
        for i, match_period in enumerate(match_periods):
            periods.append({
                i: f'{match_period[0]}-{match_period[1]}'
            })
        courses = []
        for course_str in course_strs[1:]:
            match0 = re.findall(r'\),"[0-9A-Za-z().]+","(.*?\([0-9A-Za-z().]+\))","[\d,]+","(.*?)","([01]+)",', course_str)
            match1 = re.findall(r'index =(\d+)\*unitCount\+(\d+);', course_str)
            match2 = re.search(r'var actTeachers = \[(.*?)];', course_str, re.DOTALL)
            teachers = ''
            if match2:
                names = re.findall(r'name:"([^"]+)"', match2.group(1))
                teachers = ','.join(names)
            times_dict = {}
            for value in match1:
                weekday = int(value[0]) + 1
                clazz = int(value[1]) + 1
                if weekday in times_dict:
                    times_dict[weekday].append(str(clazz))
                else:
                    times_dict[weekday] = [str(clazz)]
            for key in times_dict:
                times_dict[key] = ','.join(times_dict[key])
            courses.append({
                'name': match0[0][0],
                'classroom': match0[0][1],
                'teachers': teachers,
                'weeks': match0[0][2],
                'times': times_dict
            })
        return {
            'periods': periods,
            'courses': courses
        }

# class CourseCalender:
#     def __init__(self, emas: Eams):
#         """
#         CourseCalender 类 构造函数
#         """
#         self.main_url: Optional[str] = None
#         self.query_course_selection_status_url: Optional[str] = None
#         self.query_course_basic_info_url: Optional[str] = None
#         self.change_taking_course_url: Optional[str] = None
#         self.profile_id: Optional[int] = None
#         self.credit_limit_for_the_semester: Optional[int] = None
#         self.selected_credit: Optional[int] = None
#         self.eams: Eams = emas
#         self.session = emas.session
#
#
#
#     async def get_courseinfo(self, output_file: str, work_dir: str = "./temp/") -> None:
#         eams_content = await self.eams.get("https://eams.shanghaitech.edu.cn/eams/courseTableForStd.action")
#         eams_soup = BeautifulSoup(eams_content, 'html.parser')
#         table_id = self.find_table_id(eams_soup)
#
#         script_file = os.path.join(work_dir, 'courseinfo.js')
#         merged_file = os.path.join(work_dir, 'merged.js')
#
#         semester_id = 243 # 2024-2025第二学期
#         async with self.session.post(f"https://eams.shanghaitech.edu.cn/eams/courseTableForStd!courseTable.action?ignoreHead=1&setting.kind=std&startWeek=&semester.id={semester_id}&ids={table_id}&tutorRedirectstudentId={table_id}") as response:
#             s = await response.read()
#             table_soup = BeautifulSoup(s, 'html.parser')
#             with open(script_file, "w", encoding='utf-8') as f:
#                 f.write(table_soup.find_all("script")[-2].text)
#
#         with open(merged_file, 'wb') as wfd:
#             for f in ['./HackHeader.js', script_file, 'HackFooter.js']:
#                 with open(f, 'rb') as fd:
#                     shutil.copyfileobj(fd, wfd)
#         run_result = subprocess.run(["node", merged_file], env={"OUTPUT_PATH": output_file}, capture_output=True)
#         os.remove(merged_file)
#         if run_result.returncode != 0:
#             raise Exception(run_result.stderr)
#
