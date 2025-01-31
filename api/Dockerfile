FROM nikolaik/python-nodejs:python3.10-nodejs18
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
COPY . .
CMD [ "uvicorn", "app:app", "--port", "80", "--host", "0.0.0.0"]