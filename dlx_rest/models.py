from flask import abort
from mongoengine import *
from flask_login import UserMixin, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from itsdangerous import (TimedJSONWebSignatureSerializer
                          as Serializer, BadSignature, SignatureExpired)
from functools import wraps
import time, datetime

from dlx_rest.config import Config

## Setup some models for use

class User(UserMixin, Document):
    email = StringField(max_lengt=200, required=True, unique=True)
    password_hash = StringField(max_length=200)
    roles = ListField()
    created = DateTimeField(default=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time())))
    updated = DateTimeField(default=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time())))


    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_auth_token(self, expiration=600):
        s = Serializer(Config.JWT_SECRET_KEY, expires_in = expiration)
        return s.dumps({ 'id': str(self.id) })

    @staticmethod
    def verify_auth_token(token):
        print("Token: {}".format(token))
        s = Serializer(Config.JWT_SECRET_KEY)
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None    # valid token, but expired
        except BadSignature:
            return None    # invalid token
        user = User.objects.get(id=data['id'])
        return user

class Permission(Document):
    role = ReferenceField('Role')
    action = StringField()

class Role(Document):
    name = StringField()
    permissions = ListField()

    def has_permission(self, role, action):
        return any (
            [
                role == perm.role.name and action == perm.action
                for perm in self.permissions
            ]
        )

class SyncLog(Document):
    time = DateTimeField(default=datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'))
    record_type = StringField(max_length=200)
    record_id = StringField(max_length=200)
    response_code = IntField()
    response_text = StringField()
    xml = StringField()

    meta = {
        'collection': Config.sync_log_collection,
        'strict': False
    }


def permission_required(permissions):
    """
    Check if a user has permission to a resource.
    :param permissions: List of permissions consistent with tuples. E.g.
    [('user', 'read'), ('admin', 'create')]
    :return: a function or raise 403
    """

    def wrapper(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            roles = Permission.objects.distinct('role')
            if hasattr(current_user, 'roles'):
                if set(current_user.roles) & set(roles):
                    for role, action in permissions:
                        for user_role in current_user.roles:
                            if user_role.has_permission(role, action):
                                return func(*args, **kwargs)
            abort(403)

        return wrapped

    return wrapper