# Imports from requirements.txt
from cmath import sin
from email.policy import default
import re
import dlx
from flask import url_for, Flask, abort, g, jsonify, request, redirect, render_template, flash, session
from flask_login import current_user, login_user, login_required, logout_user
from datetime import datetime, timedelta
import datetime as dt
from urllib.parse import urlparse, parse_qs
import json, requests
from dlx.file import File, Identifier, S3, FileExists, FileExistsLanguageConflict, FileExistsIdentifierConflict
from dlx.file.s3 import S3
from dlx import DB



#Local app imports
from dlx_rest.app import app, login_manager
from dlx_rest.config import Config
from dlx_rest.models import RecordView, User, SyncLog, Permission, Role, requires_permission
from dlx_rest.forms import LoginForm, RegisterForm, CreateUserForm, UpdateUserForm, CreateRoleForm, UpdateRoleForm
from dlx_rest.utils import is_safe_url

# This function sets an expiration/timeout for idle sessions.
@app.before_request
def make_sesion_permanent():
    session.permanent = True
    app.permanent_session_lifetime = timedelta(hours=12)

    # Special case for testing, so we can test this without waiting too long
    if Config.TESTING:
        app.permanent_session_lifetime = timedelta(seconds=5)

# Put some configs into the routes for debug purposes
return_configs = {
    "env": Config.environment,
    "ver": Config.VERSION
}


@app.context_processor
def get_version():
    return dict(version=Config.VERSION)

# Main app routes
@app.route('/')
def index():
    #return render_template('index.html', title="Home")
    return redirect(url_for('get_records_list', coll="bibs"))

@app.route('/newui')
def newui():
    return redirect(url_for('editor'))

@app.route('/editor')
def editor():
    this_prefix = url_for('doc', _external=True)
    records = request.args.get('records', None)
    workform = request.args.get('workform', None)
    fromWorkform = request.args.get('fromWorkform', None)
    return render_template('new_ui.html', title="Editor", prefix=this_prefix, records=records, workform=workform, fromWorkform=fromWorkform, vcoll="editor")

@app.route('/help')
@login_required
def help():
    return render_template('help.html', vcoll="help", title="Help")

@app.route('/workform')
def workform():
    this_prefix = url_for('doc', _external=True)
    return render_template('workform.html', api_prefix=this_prefix, title="Workforms")

# Authentication
@login_manager.user_loader
def load_user(id):
    # To do: make an init script that creates an admin user
    # Also make a test for this
    try:
        user = User.objects.get(id=id)
    except:
        return None
    # Hopefully this re-generates every 10 minutes of activity...
    user.token = user.generate_auth_token().decode('UTF-8')
    return user

@app.route('/login', methods=['GET','POST'])
def login():
    next_url = request.args.get('next')
    form = LoginForm()

    if current_user.is_authenticated:
        if not is_safe_url(request, next_url):
            return abort(400)
        flash("Already authenticated")
        return redirect(next_url or url_for('index'), code=302)
    if request.method == 'POST':
        next_url = request.args.get('next')
        if Config.TESTING:
            # Special case for testing environments. 
            user = User.objects(email=form.email.data).first()
            password = form.password.data
            if user and user.check_password(password):
                login_user(user, remember=form.remember_me.data)
                if not is_safe_url(request, next_url):
                    return abort(400)
                #flash('Logged in successfully.')
                return redirect(next_url or url_for('index'), code=302)
            else:
                flash('Invalid username or password.')
                return redirect(url_for('login'), code=302)
        if form.validate_on_submit():
            user = User.objects(email=form.email.data).first()
            password = form.password.data
            if user and user.check_password(password):
                login_user(user, remember=form.remember_me.data)
                if not is_safe_url(request, next_url):
                    return abort(400)
                #flash('Logged in successfully.')
                return redirect(next_url or url_for('index'), code=302)
            else:
                flash('Invalid username or password.')
                return redirect(url_for('login'), code=302)
        else:
            flash("Unable to validate the form.")
            return redirect(url_for('login'), code=302)
    #flash("Login first.")
    return render_template('login.html', title='Sign In', form=form)

@app.route('/logout')
def logout():
    logout_user()
    #flash("Logged out successfully.")
    return redirect(url_for('login'))


# Admin section
@app.route('/admin')
@login_required
@requires_permission('readAdmin')
def admin_index():
    return render_template('admin/index.html', title="Admin")

@app.route('/admin/sync_log')
@login_required
@requires_permission('readSync')
def get_sync_log():
    items = SyncLog.objects().order_by('-time')
    return render_template('admin/sync_log.html', title="Sync Log", items=items)

@app.route('/admin/debug')
@login_required
@requires_permission('readAdmin')
def get_debug():
    return jsonify(return_configs)

# Users Admin
# Not sure if we should make any of this available to the API
@app.route('/admin/users')
@login_required
@requires_permission('readUser')
def list_users():
    users = User.objects
    return render_template('admin/users.html', title="Users", users=users)

@app.route('/admin/users/new', methods=['GET','POST'])
@login_required
@requires_permission('createUser')
def create_user():
    # To do: add a create user form; separate GET and POST
    form = CreateUserForm()
    form.roles.choices = [(r.id, r.id) for r in Role.objects()]
    form.views.choices = [(v.id, f'{v.collection}/{v.name}') for v in RecordView.objects()]
    if request.method == 'POST':
        email = request.form.get('email')
        username = request.form.get('username')
        shortname = request.form.get('shortname')
        roles = form.roles.data
        default_views = form.views.data
        password = request.form.get('password')
        created = datetime.now()

        user = User(email=email, created=created)
        user.set_password(password)
        user.username = username
        user.shortname = shortname
        for role in roles:
            try:
                r = Role.objects.get(name=role)
                user.roles.append(r)
            except:
                pass
        for view in default_views:
            v = RecordView.objects.get(id=view)
            user.default_views.append(v)
        # This still allows submission of a blank user document. We need more validation.
        try:
            user.save(validate=True)
            flash("The user was created successfully.")
            return redirect(url_for('list_users'))
        except:
            raise
            flash("An error occurred trying to create the user. Please review the information and try again.")
            return redirect(url_for('create_user'))
    else:
        return render_template('admin/createuser.html', title="Create User", form=form)

@app.route('/admin/users/<id>/edit', methods=['GET','POST'])
@login_required
@requires_permission('updateUser')
def update_user(id):
    try:
        user = User.objects.get(id=id)
    except IndexError:
        flash("The user was not found.")
        return redirect(url_for('list_users'))

    form = UpdateUserForm()
    form.roles.choices = [(r.id, r.id) for r in Role.objects()]
    form.roles.process_data([r.id for r in user.roles])
    form.views.choices = [(v.id, f'{v.collection}/{v.name}') for v in RecordView.objects()]
    form.views.process_data([v.id for v in user.default_views])

    if request.method == 'POST':
        user = User.objects.get(id=id)
        email = request.form.get('email', user.email)
        username = request.form.get('username', user.username)
        shortname = request.form.get('shortname')
        roles = request.form.getlist('roles')
        default_views = request.form.getlist('views')
        password = request.form.get('password', user.password_hash)

        user.email = email  #unsure if this is a good idea
        user.username = username
        user.shortname = shortname
        if password:
            user.set_password(password)
        user.roles = []
        for role in roles:
            try:
                r = Role.objects.get(name=role)
                user.roles.append(r)
            except:
                pass
        user.default_views = []
        for view in default_views:
            v = RecordView.objects.get(id=view)
            user.default_views.append(v)
        user.updated = datetime.now()
        
        try:
            user.save(validate=True)
            flash("The user was updated successfully.")
            return redirect(url_for('list_users'))
        except:
            flash("An error occurred trying to update the user. Please review the information and try again.")
            raise
            return render_template('admin/edituser.html', title="Edit User", user=user, form=form)
    else:
        return render_template('admin/edituser.html', title="Edit User", user=user, form=form)

@app.route('/admin/users/<id>/delete')
@login_required
@requires_permission('deleteUser')
def delete_user(id):
    user = User.objects.get(id=id)
    if user:
        user.delete()
        flash("User was deleted successfully.")
    else:
        flash("The user could not be found.")

    return redirect(url_for('list_users'))

'''Roles and permissions admin'''
@app.route('/admin/roles', methods=['GET'])
@login_required
@requires_permission('readRole')
def get_roles():
    roles = Role.objects
    return render_template('admin/roles.html', title="Roles", roles=roles)

@app.route('/admin/roles/new', methods=['GET', 'POST'])
@login_required
@requires_permission('createRole')
def create_role():
    form = CreateRoleForm()
    form.permissions.choices = [(p.id, f'{p.action} + {p.constraint_must} - {p.constraint_must_not}') for p in Permission.objects()]
    if request.method == 'POST':
        name = request.form.get('name')
        permissions = request.form.getlist('permissions')

        role = Role(name=name)
        role.permissions = []
        for permission in permissions:
            try:
                p = Permission.objects.get(action=permission)
                role.permissions.append(p)
            except:
                pass

        try:
            role.save(validate=True)
            flash("The role was created successfully.")
            return redirect(url_for('get_roles'))
        except:
            flash("An error occurred trying to create the role. Please review the information and try again.")
            return redirect(url_for('create_role'))
    else:
        return render_template('admin/createrole.html', title="Create Role", form=form)


@app.route('/admin/roles/<id>', methods=['GET', 'POST'])
@login_required
@requires_permission('updateRole')
def update_role(id):
    try:
        role = Role.objects.get(name=id)
    except IndexError:
        flash("The role was not found.")
        return redirect(url_for('list_rolees'))

    form = UpdateRoleForm()
    form.permissions.choices = [(p.id, f'{p.action} + {p.constraint_must} - {p.constraint_must_not}') for p in Permission.objects()]
    form.permissions.process_data([p.id for p in role.permissions])

    if request.method == 'POST':
        role = Role.objects.get(name=id)
        name = request.form.get('name', role.name)
        permissions = request.form.getlist('permissions')

        role.permissions = []
        for permission in permissions:
            try:
                p = Permission.objects.get(id=permission)
                role.permissions.append(p)
            except:
                pass
        
        try:
            role.save(validate=True)
            flash("The role was updated successfully.")
            return redirect(url_for('get_roles'), 302)
        except:
            flash("An error occurred trying to update the role. Please review the information and try again.")
            raise
            return render_template('admin/editrole.html', title="Update Role", role=role, form=form)
    else:
        return render_template('admin/editrole.html', title="Update Role", form=form, role=role)

@app.route('/admin/roles/<id>/delete')
@login_required
@requires_permission('deleteRole')
def delete_role(id):
    role = Role.objects.get(name=id)
    if role:
        role.delete()
        flash("Role was deleted successfully.")
    else:
        flash("The role could not be found.")
    return redirect(url_for('get_roles'))

'''
Permissions aren't included here because they are created in the course of 
defining new routes. Their only purpose in the database is to be visibile to the
user interface and for assignment to specific roles.
'''

# Basket management
# Should these also be in the API?
'''
@app.route('/user/basket')
@login_required
@requires_permission(register_permission('getBasket'))
def get_basket():
    print(current_user.id)
    try:
        basket = Basket.objects.get(id=current_user.id)
        return_data = {"user": current_user, "basket": basket}
        return return_data
    except DoesNotExist:
        return {"status": 404}
'''

'''
The following functions probably should go into another file, perhaps a utils.py?
Idea for future refactor, but not essential now.
'''
def build_pagination(page_link, coll, q, start, limit, sort, direction):
    parsed_link = urlparse(page_link)
    params = parse_qs(parsed_link.query)

    try:
        return_page = url_for(
            'search_records', 
            coll=coll, 
            q=q, 
            start=params['start'], 
            limit=limit, 
            sort=sort, 
            direction=direction
        )

        return return_page
    except:
        raise

def build_head(coll, record_data):
    if coll == 'bibs':
        second_line = []
        if len(record_data['symbol']) > 1:
            second_line.append(record_data['symbol'])
        if len(record_data['date']) > 1:
            second_line.append(record_data['date'])
        if len(record_data['types']) > 1:
            second_line.append(record_data['types'])
        record = {
            'id': record_data['_id'],
            'title_line': record_data['title'],
            'second_line': " | ".join(second_line)
        }
        return record
    elif coll == 'auths':
        second_line = []
        if len(record_data['alt']) > 1:
            second_line.append(record_data['alt'])
        record = {
            'id': record_data['_id'],
            'title_line': record_data['heading'],
            'second_line': " | ".join(second_line)
        }
        return record


# Records Routes
@app.route('/records/<coll>')
def get_records_list(coll):
    # This is just a passthrough route
    return redirect(url_for('search_records', coll=coll))

def get_index_list(record_type):
    return index_list

@app.route('/records/<coll>/search')
@login_required
def search_records(coll):
    api_prefix = url_for('doc', _external=True)
    limit = request.args.get('limit', 250)
    start = request.args.get('start', 1)
    q = request.args.get('q', '')

    # Compare the old query with the new query; if the new query is different, reset pagination
    # if old_q contains anything at all, it returns a list, so let's make sure we're checking
    # for the first string in the list entry instead of assuming we got a string.
    old_q = parse_qs(urlparse(request.referrer).query).get('q', [''])
    
    if q != old_q[0]:
        start = 1

    session.permanent = True

    # Move vcoll variable here so we can use it in the session 
    # to review
    vcoll = coll
    
    if request.args.get('subtype') == 'speech':
        vcoll = "speeches"
    elif request.args.get('subtype') == 'vote':
        vcoll = "votes"
    elif request.args.get('subtype') == 'all':
        vcoll = "all"

    sort =  request.args.get('sort')
    direction = request.args.get('direction') #, 'desc' if sort == 'updated' else '')
    subtype  = request.args.get('subtype')

    # Should set a default ...
    engine = request.args.get('engine', 'community')

    if sort and direction:
        # Regardless of what's in the session already
        session[f"sort_{vcoll}"] = {"field": sort, "direction": direction}
        this_v = session[f"sort_{vcoll}"]
    else:
        # See if something is in the session already
        try:
            # We have session values, so use those
            this_v = session[f"sort_{vcoll}"]
            sort = session[f"sort_{vcoll}"]["field"]
            direction = session[f"sort_{vcoll}"]["direction"]
        except KeyError:
            # There is nothing in the session, so fallback to defaults
            sort = "updated"
            direction = "desc"
    
    # TODO dlx "query analyzer" to characterize the search string and sort accordingly
    terms = re.split(' *(AND|OR|NOT) +', q)
        
    for term in (filter(None, terms)):
        if re.search('[:<>]', term) is None and term not in ('AND', 'OR', 'NOT'):
            if re.match('[A-z]+/', term) and len(terms) == 1:
                # TODO "looks like symbol" util function
                q = f'symbol:"{term.upper()}"'

    search_url = url_for('api_records_list', collection=coll, start=start, limit=limit, sort=sort, direction=direction, search=q, engine=engine, _external=True, format='brief', subtype=subtype)

    # todo: get all from dlx config
    # Sets the list of logical field indexes that should appear in advanced search
    if vcoll == 'speeches':
        index_list = json.dumps(['symbol', 'country_org', 'speaker', 'agenda', 'related_docs', 'bib_creator'])
    elif vcoll == 'votes':
        index_list = json.dumps(['symbol', 'body', 'agenda', 'bib_creator'])
    else:
        logical_fields = getattr(dlx.Config, f"{coll.strip('s')}_logical_fields")
        fields = list(logical_fields.keys())
        
        for f in filter(lambda x: x in fields, ('notes', 'speaker', 'country_org')):
            fields.remove(f)

        index_list = json.dumps(fields)

    return render_template('search.html', api_prefix=api_prefix, search_url=search_url, collection=coll, vcoll=vcoll, index_list=index_list, title=vcoll)

@app.route('/records/<coll>/browse')
@login_required
def browse(coll):
    api_prefix = url_for('doc', _external=True)

    # todo: get all from dlx config
    if request.args.get('subtype') == 'speech':
        index_list = json.dumps(['symbol', 'body', 'speaker', 'agenda', 'country_org', 'bib_creator'])
    elif request.args.get('subtype') == 'vote':
        index_list = json.dumps(['symbol', 'body', 'agenda', 'related_docs', 'bib_creator'])
    else:
        logical_fields = getattr(dlx.Config, f"{coll.strip('s')}_logical_fields")
        fields = list(logical_fields.keys())
        
        for f in filter(lambda x: x in fields, ('notes', 'speaker', 'country_org')):
            fields.remove(f)

        index_list = json.dumps(fields)

    return render_template('browse_list.html', api_prefix=api_prefix, coll=coll, index_list=index_list, vcoll="browse", subtype=request.args.get('subtype'), title=f'Browse ({request.args.get("subtype")})')

@app.route('/records/<coll>/browse/<index>')
@login_required
def browse_list(coll, index):
    q = request.args.get('q', 'a')
    api_prefix = url_for('doc', _external=True)
    
    return render_template('browse_list.html', api_prefix=api_prefix, coll=coll, index=index, q=q, vcoll="browse", subtype=request.args.get('subtype'))

@app.route('/records/auths/review')
@login_required
@requires_permission("reviewAuths")
def review_auth():
    # min_date = "2022-03-01"
    min_date = dt.date.today() - dt.timedelta(days=7)
    api_prefix = url_for('doc', _external=True)
    limit = request.args.get('limit', 25)
    start = request.args.get('start', 1)
    q = request.args.get('q', f'updated>{min_date} AND NOT 999__c:\'t\'')
    sort =  request.args.get('sort')
    direction = request.args.get('direction') #, 'desc' if sort == 'updated' else '')
                
    if not sort:
        sort = 'updated'
        direction = 'desc'
    elif sort != 'relevance' and not direction:
        direction = 'asc'

    search_url = url_for('api_records_list', collection="auths", start=start, limit=limit, sort=sort, direction=direction, search=q, _external=True, format='brief')

    return render_template('review_auths.html', api_prefix=api_prefix, search_url=search_url, collection="auths", vcoll="auths", title="AuthReview")

@app.route('/records/speeches/review')
@login_required
def review_speeches():
    api_prefix = url_for('doc', _external=True)
    q = request.args.get('q')
    return render_template('review_speeches.html', api_prefix=api_prefix, title="Speech Review", q=q)

@app.route('/records/<coll>/<id>', methods=['GET'])
@login_required
def get_record_by_id(coll,id):
    this_prefix = url_for('doc', _external=True)
    return render_template('record.html', collection=coll, record_id=id, api_prefix=this_prefix)

@app.route('/records/<coll>/new')
@login_required
def create_record(coll):
    this_prefix = url_for('doc', _external=True)
    return render_template('record.html', coll=coll, prefix=this_prefix)

@app.route('/files')
@login_required
@requires_permission('readFile')
def upload_files():
    return render_template('process_files.html', vcoll="files", title="Files")


@app.route('/files/process', methods=["POST"])
@login_required
@requires_permission('createFile')
def process_files():
    S3.connect(bucket=Config.bucket)

    fileInfo = request.form.get("fileText")
    fileTxt = json.loads(fileInfo)
    
    # Get the global identifier type for all files
    globalIdentifierType = request.form.get("globalIdentifierType", "Document Symbol")

    i = 0
    fileResults = []
    record = {}
    
    for f in request.files.getlist('file[]'):
        try:
            record['filename'] = f.filename
            record['identifier'] = fileTxt[i]["docSymbol"]

            langArray = []
    
            if (fileTxt[i]["en"]["selected"]):
                langArray.append("EN")

            if (fileTxt[i]["fr"]["selected"]):
                langArray.append("FR")
            
            if (fileTxt[i]["es"]["selected"]):
                langArray.append("ES")

            if (fileTxt[i]["ar"]["selected"]):
                langArray.append("AR")
            
            if (fileTxt[i]["zh"]["selected"]):
                langArray.append("ZH")

            if (fileTxt[i]["ru"]["selected"]):
                langArray.append("RU")

            if (fileTxt[i]["de"]["selected"]):
                langArray.append("DE")

            record['languages'] = langArray

            record['identifier'] = fileTxt[i]["docSymbol"]

            record['overwrite'] = fileTxt[i]["overwrite"]
            
            record['identifierType'] = globalIdentifierType

            # Read file bytes
            file_bytes = f.read()
            
            # Create identifier based on global type
            if globalIdentifierType == "URI":
                identifier_obj = Identifier('uri', record['identifier'])
            else:  # Default to Document Symbol
                identifier_obj = Identifier('symbol', record['identifier'])

            result = File.import_from_binary(
                file_bytes,
                identifiers=[identifier_obj],
                filename=f.filename,
                languages=record['languages'],
                mimetype='application/pdf',
                source='ME::File::Uploader',
                overwrite=record['overwrite']
            )
            record['result'] = "File uploaded successfully"
        except FileExistsLanguageConflict as e:
            record['result'] = e.message
        except FileExistsIdentifierConflict as e:
            record['result'] = e.message
        except FileExists:
            record['result'] = "File already exists in the system"
        except:
            raise

        i = i + 1
        
        fileResults.append(record)
        record = {}
    
    return render_template('file_results.html', submitted=fileResults, vcoll="files", user=current_user.username)
   

@app.route('/files/search')
@login_required
@requires_permission('readFile')
def search_files():
    baseURL = url_for('doc', _external=True)
    #this_prefix = baseURL.replace("/api/", url_for('files_results'))
    this_prefix = url_for('files_results')
    return render_template('file_update.html', prefix=this_prefix, vcoll="files", title="Files")


@app.route('/files/update/results', methods=['GET', 'POST'])
@login_required
@requires_permission('readFile')
def files_results():
    text = request.form.get('text')
    option = request.form.get('exact')

    results = process_text(text, option)
    return jsonify(results)


def process_text(text, option):
    DB.connect(Config.connect_string, database=Config.dbname)
    
    pipeline = []

    collation={
        'locale': 'en',
        'strength': 1,
        'numericOrdering': True
    }

    if option == "true":
        match_stage = {
            '$match': {
                'identifiers.value': text
            }
        }
    else: #regex by default
        match_stage = {
            '$match': {
                'identifiers.value': {
                    '$regex': text, 
                    '$options': 'i'
                }
            }
        }

    project_stage = {
        '$project': {
            '_id': 1, 
            'identifier_type': {'$arrayElemAt': ['$identifiers.type', 0]},
            'identifier_value': {'$arrayElemAt': ['$identifiers.value', 0]}, 
            'languages': 1, 
            'filename': 1,
            'uri':1
        }
    }

    sort_stage = {
        '$sort': {
            'identifier_value': 1, 
            'filename': 1
        }
    }

    pipeline.append(match_stage)
    pipeline.append(project_stage)
    pipeline.append(sort_stage)
        

    results = list(DB.files.aggregate(pipeline, collation=collation))

    return results

@app.route('/files/update', methods=['POST'])
@login_required
@requires_permission('updateFile')
def update_file():
    """
    Updates the file entry based on record id.
    Updates the first identifier (type and value) and languages associated with the file.
    Does not create new identifier entries, only updates the existing first identifier.
    """
    S3.connect(bucket=Config.bucket)

    try:
        record_id = request.form.get('record_id')
        identifier_type = request.form.get('identifier_type')
        identifier_value = request.form.get('identifier_value')
        langs = request.form.getlist('lang')

        if not record_id or not identifier_type or not identifier_value:
            return jsonify({'updated': False, 'message': 'Missing required fields (record_id, identifier_type, identifier_value)'}), 400

        f = File.from_id(record_id)
        
        if not f or len(f.identifiers) == 0:
            return jsonify({'updated': False, 'message': 'File not found or has no identifiers'}), 404
        
        # Update only the first identifier's type and value (in place)
        f.identifiers[0].type = identifier_type
        f.identifiers[0].value = identifier_value
        
        # Update languages
        f.languages = langs
        f.commit()
        
        return jsonify({
            'updated': True, 
            'message': 'File updated successfully',
            'identifier_type': identifier_type,
            'identifier_value': identifier_value,
            'languages': langs
        })
    except Exception as e:
        return jsonify({'updated': False, 'message': f'Error updating file: {str(e)}'}), 400

@app.route('/import')
@login_required
@requires_permission('importMarc')
def import_marc():
    this_prefix = url_for('doc', _external=True)
    #print(this_prefix)
    return render_template('import_marc.html', api_prefix=this_prefix)

@app.route('/reports/dashboard02', methods=["GET"])
@login_required
def show_dashboard02():
    return render_template('dashboard02.html',vcoll="dashboard02", user=current_user.username, users=User.objects)     
 
@app.route('/reports/dashboard03', methods=["GET"])
@login_required
def show_dashboard03():   
    return render_template('dashboard03.html',vcoll="dashboard03", user=current_user.username)

@app.route('/reports/callback-search', methods=["GET"])
@login_required
def show_callback_search():
    this_prefix = url_for('doc', _external=True)
    return render_template('callback_search.html', api_prefix=this_prefix)