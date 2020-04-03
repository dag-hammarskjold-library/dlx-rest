from mongoengine import *
from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash
import time

## Setup some models for use

class User(UserMixin, Document):
    email = StringField(max_lengt=200, required=True, unique=True)
    password_hash = StringField(max_length=200)
    status = StringField(max_length=200)
    created = DateTimeField(default=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time())))
    updated = DateTimeField(default=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time())))


    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)