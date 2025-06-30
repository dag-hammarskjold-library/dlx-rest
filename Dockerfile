FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y git

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

COPY . .

ENV FLASK_APP=dlx_rest.app
ENV DLX_REST_DEV=True

EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "dlx_rest.app:dev_app", "--workers", "4", "--timeout", "120"]