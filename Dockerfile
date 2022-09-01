FROM python:3.10-slim-buster

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DLX_REST_DEV="True"
ENV FLASK_APP=dlx_rest.app
ENV FLASK_ENV=development

WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app/requirements.txt
RUN apt-get update && apt-get install -y git
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . /usr/src/app