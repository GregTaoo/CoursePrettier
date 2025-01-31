# CoursePrettier-backend

The application is hosted on [CoursePrettier](http://prettier.geekpie.club/). The frontend repository is [here](https://github.com/Clarivy/CoursePrettier-frontend).

See the usage of CoursePrettier [here](https://clarivy.github.io/posts/courseprettier/courseprettier/).

## Installation

```bash
git clone https://github.com/Clarivy/CoursePrettier-backend
cd CoursePrettier-backend
pip install -r requirements.txt
uvicorn app:app --port 8000 --host 0.0.0.0
```

or use [Dockerfile](https://docs.docker.com/get-started/02_our_app/) to build a container.

## Acknowledgements

- [ShanghaiTech OneAPI](https://github.com/yanglinshu/openapi-ce) by [Yang Linshu](https://github.com/yanglinshu/) and [Leomund](https://gitlab.isp.moe/Leomund)

- [Exam-Table-ICS-Formatter](https://github.com/wtlyu/Exam-Table-ICS-Formatter) and [Course-Table-ICS-Formatter](https://github.com/wtlyu/Course-Table-ICS-Formatter)

- [Python 大学生课表 (.ics) 生成](https://github.com/junyilou/python-ical-timetable)