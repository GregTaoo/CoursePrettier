import base64
import pickle
from typing import Tuple, Optional, Union

from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from IDS.Credential import Credential
from IDS.Eams import Eams
from IDS.Exception import SessionExpiredError


class LoginParams(BaseModel):
    user_id: str
    password: str

class CourseTableParams(BaseModel):
    semester_id: Union[str, int]
    table_id: Union[str, int] = None
    start_week: Union[int] = None

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def set_cookies(response: Response, cred: Credential, user_id: str):
    cookie_str = base64.b64encode(pickle.dumps(cred.session.cookie_jar._cookies)).decode("utf-8")
    response.set_cookie('LOGIN_SESSION', cookie_str, max_age=7776000)
    response.set_cookie('STUDENT_ID', user_id, max_age=7776000)

def clear_cookies(response: Response):
    response.set_cookie('LOGIN_SESSION', '', max_age=0)
    response.set_cookie('STUDENT_ID', '', max_age=0)

def get_cookies(request: Request) -> Tuple[str, str]:
    user_id = request.cookies.get("STUDENT_ID")
    cookie_str = request.cookies.get("LOGIN_SESSION")
    return user_id, cookie_str

def return_message(success: bool, message=None) -> dict:
    return {
        "isSuccess": success,
        "message": message
    } if message is not None else {
        "isSuccess": success
    }

def get_credential(request: Request) -> Optional[Credential]:
    user_id, cookie_str = get_cookies(request)
    if user_id and cookie_str:
        cred = Credential(user_id, base64.b64decode(cookie_str))
        cred.is_login = True
        return cred
    else:
        return None

@app.post("/api/login")
async def login(params: LoginParams, response: Response):
    user_id, password = params.user_id, params.password
    try:
        int(user_id)
    except ValueError:
        return return_message(False, "Invalid UserID")
    try:
        async with Credential(user_id) as cred:
            await cred.login(password)
            eams = Eams(cred)
            await eams.login()
            if cred.is_login:
                set_cookies(response, cred, user_id)
                return return_message(True)
    except Exception as e:
        return return_message(False, str(e))

@app.post("/api/logout")
async def logout(request: Request, response: Response):
    try:
        async with get_credential(request) as cred:
            if cred is not None:
                cred.close()
            clear_cookies(response)
            return return_message(True)
    except Exception as e:
        return return_message(False, str(e))

@app.post("/api/semesters")
async def semesters(request: Request):
    try:
        async with get_credential(request) as cred:
            if cred is None:
                return return_message(False, 'Please login first')
            eams = Eams(cred)
            semesters_dict, default_semester, table_id = await eams.get_semesters()
            return return_message(True, {
                "semesters": semesters_dict,
                "default_semester": default_semester,
                "table_id": table_id
            })
    except SessionExpiredError:
        return return_message(False, 'Session expired')
    except Exception as e:
        return return_message(False, str(e))

@app.post("/api/course_table")
async def course_table(params: CourseTableParams, request: Request):
    try:
        async with get_credential(request) as cred:
            if cred is None:
                return return_message(False, 'Please login first')
            eams = Eams(cred)
            return return_message(True, await eams.get_course_table(params.semester_id, params.table_id, params.start_week))
    except SessionExpiredError:
        return return_message(False, 'Session expired')
    except Exception as e:
        return return_message(False, str(e))

# @app.post("/api/login")
# async def login(params: LoginParams):
#     user_id = params.userID
#     password = params.password
#     try:
#         int(user_id)
#     except ValueError:
#         return {
#             "isSuccess": False,
#             "message": "Invalid userid"
#         }
#     job_id = str(uuid.uuid4())
#     home_dir = os.path.join('./data', job_id)
#     table_file = os.path.join(home_dir, 'courseinfo.json')
#     try:
#         async with Credential(user_id) as cred:
#             await cred.login(password)
#             eams = Eams(cred)
#             await eams.login()
#             cc = CourseCalender(eams)
#             os.makedirs(home_dir, exist_ok=True)
#             await cc.get_courseinfo(
#                 output_file=table_file,
#                 work_dir=home_dir
#             )
#     except Exception as e:
#         return {
#             "isSuccess": False,
#             "message": str(e)
#         }
#
#     if not os.path.exists(table_file):
#         return {
#             "isSuccess": False,
#             "message": "Table not found",
#         }
#     try:
#         with open(table_file, 'r', encoding='utf-8') as f:
#             return {
#                 "isSuccess": True,
#                 "message": "OK",
#                 "id": job_id,
#                 "table": json.load(f)
#             }
#     except Exception as e:
#         return {
#             "isSuccess": False,
#             "message": str(e)
#         }
#
# @app.get("/api/ics")
# async def get_ics(id: str):
#     if id == "":
#         return HTTPException(status_code=400, detail="Invalid id")
#     home_dir = os.path.join('./data', id)
#     table_file = os.path.join(home_dir, 'courseinfo.json')
#     if not os.path.exists(table_file):
#         return HTTPException(status_code=404, detail="Table not found")
#     ics_file = os.path.join(home_dir, 'courseinfo.ics')
#     exporter = ICS_Exporter(start_monday=[2025, 2, 17], calender_name="2024-2025学年2学期")
#     exporter.parse_json(table_file)
#     exporter.export(ics_file)
#     return FileResponse(ics_file, media_type="text/calendar", filename="courseinfo.ics")

