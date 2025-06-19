# CoursePrettier-Remake

Original repo: [Clarivy/CoursePrettier-backend](https://github.com/Clarivy/CoursePrettier-backend)

The application is hosted on [CoursePrettier](https://course.gregtao.top)

~~See the usage of CoursePrettier [here](https://clarivy.github.io/posts/courseprettier/courseprettier/).~~ (Outdated)

## Installation

First, you need to clone this repo.

```bash
git clone https://github.com/GregTaoo/CoursePrettier
cd CoursePrettier
```

The next two steps (Backend/Frontend) can be done in parallel.

#### Backend

[Python 3.12](https://www.python.org/downloads/release/python-3120) and a [venv](https://docs.python.org/3.12/library/venv.html) of python are suggested.

```bash
pip install -r requirements.txt
uvicorn api.app:app --port 8000 --host 0.0.0.0
```

#### Frontend

You need to install [Node.js](https://nodejs.org/en) first.

```bash
npm i
npm start
```

Or, you can deploy the entire project with [Vercel](https://vercel.com/). 
Just fork this repo, check your Vercel account, and follow the [instruction](https://vercel.com/docs/git/vercel-for-github) provided by Vercel.

## Acknowledgements

- [CoursePrettier-backend](https://github.com/Clarivy/CoursePrettier-backend) by [Clarivy](https://github.com/Clarivy)

- [ShanghaiTech OneAPI](https://github.com/yanglinshu/openapi-ce) by [Yang Linshu](https://github.com/yanglinshu/) and [Leomund](https://gitlab.isp.moe/Leomund)