FROM python:3.11-slim-buster

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DLX_REST_DEV="True"
ENV FLASK_APP=dlx_rest.app
ENV AWS_DEFAULT_REGION=us-east-1

WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app/requirements.txt
RUN apt-get update && apt-get install -y git
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install gunicorn

COPY . /usr/src/app

EXPOSE 5000

CMD ["gunicorn", "--bind", ":5000", "--timeout", "900", "dlx_rest.app:app"]