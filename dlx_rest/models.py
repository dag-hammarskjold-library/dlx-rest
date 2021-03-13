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

class Permission(Document):
    #role = ReferenceField('Role')
    action = StringField()

class Role(Document):
    name = StringField()
    permissions = ListField(ReferenceField(Permission))

    def has_permission(self, action):
        return any (
            [
                action == perm.action
                for perm in self.permissions
            ]
        )

class User(UserMixin, Document):
    email = StringField(max_lengt=200, required=True, unique=True)
    password_hash = StringField(max_length=200)
    roles = ListField(ReferenceField(Role))
    created = DateTimeField(default=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time())))
    updated = DateTimeField(default=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time())))


    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_auth_token(self, expiration=600):
        s = Serializer(Config.JWT_SECRET_KEY, expires_in = expiration)
        return s.dumps({ 'id': str(self.id) })

    def add_role_by_name(self, role_name):
        try:
            role = Role.objects.get(name=role_name)
            self.roles.append(role)
        except:
            raise

    def has_role(self, role_name):
        return any (
            [
                role_name == role.name
                for role in self.roles
            ]
        )

    @staticmethod
    def verify_auth_token(token):
        s = Serializer(Config.JWT_SECRET_KEY)
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None    # valid token, but expired
        except BadSignature:
            return None    # invalid token
        user = User.objects.get(id=data['id'])
        return user

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
            if hasattr(current_user, 'roles'):
                if set(current_user.roles):
                    for perm in permissions:
                        for user_role in current_user.roles:
                            if user_role.has_permission(perm):
                                return func(*args, **kwargs)
            abort(403)

        return wrapped

    return wrapper