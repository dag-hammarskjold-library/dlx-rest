from flask import abort
from mongoengine import *
from flask_login import UserMixin, current_user
from mongoengine.document import Document
from mongoengine.fields import DictField, GenericReferenceField, ListField, ReferenceField, StringField
from werkzeug.security import check_password_hash, generate_password_hash
from dlx_rest.utils import (TimedJSONWebSignatureSerializer
                          as Serializer, BadSignature, SignatureExpired)
from functools import wraps
from ulid import ULID
import time, datetime, uuid


from dlx_rest.config import Config

## Setup some models for use

class Permission(Document):
    action = StringField(required=True)
    constraint_must = ListField()
    constraint_must_not = ListField()

class Role(Document):
    name = StringField(primary_key=True)
    permissions = ListField(ReferenceField(Permission))

    def has_permission(self, action):
        return any (
            [
                action == perm.action
                for perm in self.permissions
            ]
        )

    def add_permission_by_name(self, action):
        # We'll use the register_permission method just to make sure it's available
        if action not in self.permissions:
            permission = register_permission(action)
            this_p = Permission.objects.get(action=permission)
            self.permissions.append(this_p)
            self.save()



class MarcFieldSet(EmbeddedDocument):
    field = StringField(max_length=3, min_length=3, required=True)
    subfields = ListField()         # Consider adding choices here

class RecordView(Document):
    name = StringField()
    collection = StringField(choices=["bibs","auths"])
    fieldsets = EmbeddedDocumentListField(MarcFieldSet)

    def to_json(self):
        return_data = {
            'name': self.name,
            'collection': self.collection,
            'fieldsets': []
        }

        for f in self.fieldsets:
            return_data['fieldsets'].append({'field': f.field, 'subfields': f.subfields})
        
        return return_data



class User(UserMixin, Document):
    email = StringField(max_length=200, required=True, unique=True)
    display = StringField(max_length=200, required=True)
    password_hash = StringField(max_length=200)
    roles = ListField(ReferenceField(Role))
    default_views = ListField(ReferenceField(RecordView))
    created = DateTimeField(default=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time())))
    updated = DateTimeField(default=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time())))

    def __str__(self):
        return {
            "email": self.email,
            "display": self.display
        }


    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_auth_token(self, expiration=600):
        s = Serializer(Config.JWT_SECRET_KEY, expires_in = expiration)
        return s.dumps({ 'id': str(self.id) })

    def add_role_by_name(self, role_name):
        if role_name not in self.roles:
            try:
                role = Role.objects.get(name=role_name)
                self.roles.append(role)
                self.save()
            except:
                raise

    def my_basket(self):
        # We want to return only one basket here; later we can add more.
        this_baskets = Basket.objects(owner=self)
        if len(this_baskets) == 0:
            # Set a UUID5 for the name; when users can have multiple baskets, this can be anything.
            new_basket = Basket(name=str(uuid.uuid5(uuid.NAMESPACE_DNS, self.email)), owner=self, items=[])
            new_basket.save()
            return new_basket
        else:
            this_basket = Basket.objects(owner=self)[0]
            return this_basket

    # For determining admin or not admin, has_role() should
    # be sufficient. Admin should get all permissions anyway
    def has_role(self, role_name):
        return any (
            [
                role_name == role.id
                for role in self.roles
            ]
        )

    def has_permission(self, permission_name):
        my_permissions = []
        for role in self.roles:
            if role.has_permission(permission_name):
                return True
        return False

    def permissions_list(self):
        return_data = []
        for role in self.roles:
            for perm in role.permissions:
                return_data.append(
                    {'action': perm.action, 'constraints': {'must': perm.constraint_must, 'must_not': perm.constraint_must_not}}
                )
        return return_data

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


class Basket(Document):
    owner = ReferenceField(User)
    name = StringField(max_length=200, required=True)
    items = ListField(DictField())

    def get_item_by_id(self, item_id):
        this_item = list(filter(lambda x: x['id'] == item_id, self.items))
        return this_item

    def get_item_by_coll_and_rid(self, collection, record_id):
        return list(filter(lambda x: x['record_id'] == record_id and x['collection'] == collection, self.items))[0]

    def add_item(self, item):
        existing_item = list(filter(lambda x: x['collection'] == item['collection'] and x['record_id'] == item['record_id'], self.items))
        if len(existing_item) == 0:
            ulid = ULID()
            item['id'] = str(ulid.to_uuid())
            self.items.append(item)
            self.save()

    def remove_item(self, item_id):
        #self.items = list(filter(lambda x: x['collection'] != item['collection'] and x['record_id'] != item['record_id'], self.items))
        this_item = self.get_item_by_id(item_id)
        if this_item is not None:
            self.items = list(filter(lambda x: x['id'] != item_id, self.items))
            self.save()

    def clear(self):
        self.items = []
        self.save()


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



# This still should work for unconstrained permissions, but if we need additional
# constraints, this will have to change
def requires_permission(action):
    def wrapper(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            if hasattr(current_user, 'roles'):
                if set(current_user.roles):
                    for user_role in current_user.roles:
                        if user_role.has_permission(action):
                            return func(*args, **kwargs)
            abort(403)
        return wrapped
    return wrapper

def register_role(name):
    try:
        role = Role.objects.get(name=name)
    except DoesNotExist:
        role = Role(name=name)
        role.save()
    return role
    
def register_permission(action):
    try:
        permission = Permission.objects.get(action=action)
        # Permission exists, so let's make sure it's added to the admin role automatically.
        r = register_role('admin')
        if not r.has_permission(action):
            r.permissions.append(permission)
            r.save()
        return permission.action
    except DoesNotExist:
        permission = Permission(action=action)
        permission.save()
        r = register_role('admin')
        if not r.has_permission(action):
            r.permissions.append(permission)
            r.save()
        return permission.action