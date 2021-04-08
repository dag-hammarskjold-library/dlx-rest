from flask_wtf import FlaskForm
from flask_mongoengine.wtf import model_form
from wtforms import StringField, PasswordField, BooleanField, SubmitField, SelectField, SelectMultipleField, HiddenField
from wtforms.fields import SelectFieldBase
from wtforms.validators import DataRequired, EqualTo

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')
    #next_url = HiddenField()

class RegisterForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired(), EqualTo('confirm', message='Passwords must match')])
    confirm = PasswordField('Confirm Password')
    submit = SubmitField('Register')

class CreateUserForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    # To do: Make this list come from the database.
    roles = SelectMultipleField('Roles')
    submit = SubmitField('Create')

class UpdateUserForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    # To do: Make this list come from the database.
    roles = SelectMultipleField('Roles')
    submit = SubmitField('Update')

class CreateRoleForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired()])
    # To do: Make this list come from the database.
    permissions = SelectMultipleField('Permissions')
    submit = SubmitField('Create')

class UpdateRoleForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired()])
    # To do: Make this list come from the database.
    permissions = SelectMultipleField('Permissions')
    submit = SubmitField('Update')