from dlx_rest.app import app
from dlx_rest.models import User, Role, Permission
from bson.objectid import ObjectId
import click
import difflib
import string
import secrets
import re

from dlx import DB
from dlx.marc import Auth, Query, Condition, Datafield

try:
    import requests
    from rdflib import Graph, Namespace, URIRef
    from rdflib.namespace import SKOS
except ImportError:
    requests = None
    Graph = None
    Namespace = None
    URIRef = None
    SKOS = None

DCTERMS = Namespace("http://purl.org/dc/terms/") if Namespace else None

SKOS_TAG_MAP = {
    "prefLabel": {
        "ar": "995",
        "zh": "996",
        "en": "150",
        "fr": "993",
        "ru": "997",
        "es": "994",
        "default": "750",
    },
    "altLabel": {
        "ar": "495",
        "zh": "496",
        "en": "450",
        "fr": "493",
        "ru": "497",
        "es": "494",
        "default": "450",
    },
    "scopeNote": {
        "ar": "935",
        "zh": "936",
        "en": "680",
        "fr": "933",
        "ru": "937",
        "es": "934",
        "default": "680",
    },
    "historyNote": {"en": "688", "default": "688"},
    "note": {
        "en": "670",
        "ar": "695",
        "zh": "696",
        "fr": "693",
        "ru": "697",
        "es": "694",
        "default": "670",
    },
}


SKOS_MERGE_REPLACE_TAGS = {
    *{tag for tags_by_language in SKOS_TAG_MAP.values() for tag in tags_by_language.values()},
    "035",
    "040",
    "072",
    "550",
}


def _is_tcode(value):
    return bool(re.match(r"^T\d+$", value or ""))


def generate_password():
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(alphabet) for i in range(20))
    return password


def mint_tcode():
    cursor = DB.handle.thesaurus_codes.find(
        {"field_035": {"$regex": r"^T\d+$"}}
    ).sort("field_035", -1).limit(1)
    top = next(cursor, None)

    if top is None:
        return "T0000001"

    return f"T{int(top['field_035'][1:]) + 1:07d}"


def save_tcode(tcode, auth_id, label, uri):
    DB.handle.thesaurus_codes.update_one(
        {"field_035": tcode},
        {
            "$set": {
                "field_035": tcode,
                "field_001": str(auth_id),
                "field_150": label,
                "uri": uri,
            }
        },
        upsert=True,
    )


def _require_skos_deps():
    if not all((requests, Graph, Namespace, URIRef, SKOS)):
        raise click.ClickException(
            "SKOS conversion requires optional dependencies 'requests' and 'rdflib'."
        )


def _populate_graph(uri, graph=None):
    _require_skos_deps()

    graph = graph or Graph()
    response = requests.get(uri, headers={"accept": "text/turtle"}, timeout=30)
    response.raise_for_status()
    graph.parse(data=response.text, format="turtle")
    return graph


def _field_tag(predicate_name, language):
    tags = SKOS_TAG_MAP[predicate_name]
    return tags.get(language) or tags["default"]


def _append_literal_field(auth, tag, value):
    field = Datafield(tag=tag, record_type="auth")
    field.ind1 = " "
    field.ind2 = " "
    field.set("a", str(value))
    auth.fields.append(field)


def _to_marc(uri, auth_control=True):
    _require_skos_deps()

    graph = _populate_graph(uri)
    uri_ref = URIRef(uri)
    auth = Auth()

    auth.fields.append(Datafield(tag="035", record_type="auth").set("a", uri))

    for identifier in graph.objects(uri_ref, DCTERMS.identifier):
        value = str(identifier)
        if "lib-thesaurus" not in value:
            auth.fields.append(Datafield(tag="035", record_type="auth").set("a", value))

    auth.set_values(
        ("040", "a", "NNUN"),
        ("040", "b", "eng"),
        ("040", "f", "unbist"),
    )

    if auth_control:
        for broader in graph.objects(uri_ref, SKOS.broader):
            broader_uri = str(broader)
            broader_code = broader_uri.rstrip("/").split("/")[-1]

            if len(broader_code) == 6 and broader_code.isdigit():
                dotted = ".".join(
                    broader_code[idx : idx + 2] for idx in range(0, len(broader_code), 2)
                )
                hierarchy_field = Datafield(tag="072", record_type="auth")
                hierarchy_field.ind1 = "7"
                hierarchy_field.ind2 = " "
                hierarchy_field.set("a", dotted)
                hierarchy_field.set("2", "unbist")
                auth.fields.append(hierarchy_field)
            else:
                _populate_graph(broader_uri, graph=graph)
                for label in graph.objects(URIRef(broader_uri), SKOS.prefLabel):
                    if getattr(label, "language", None) == "en":
                        auth.fields.append(
                            Datafield(tag="550", record_type="auth")
                            .set("w", "g")
                            .set("a", str(label), auth_control=True)
                        )

        for related in graph.objects(uri_ref, SKOS.related):
            related_uri = str(related)
            _populate_graph(related_uri, graph=graph)

            for label in graph.objects(URIRef(related_uri), SKOS.prefLabel):
                if getattr(label, "language", None) == "en":
                    auth.fields.append(
                        Datafield(tag="550", record_type="auth").set(
                            "a", str(label), auth_control=True
                        )
                    )

        for narrower in graph.objects(uri_ref, SKOS.narrower):
            narrower_uri = str(narrower)
            _populate_graph(narrower_uri, graph=graph)

            for label in graph.objects(URIRef(narrower_uri), SKOS.prefLabel):
                if getattr(label, "language", None) == "en":
                    auth.fields.append(
                        Datafield(tag="550", record_type="auth")
                        .set("w", "h")
                        .set("a", str(label), auth_control=True)
                    )

    predicate_map = (
        ("prefLabel", SKOS.prefLabel),
        ("altLabel", SKOS.altLabel),
        ("scopeNote", SKOS.scopeNote),
        ("historyNote", SKOS.historyNote),
        ("note", SKOS.note),
    )

    for predicate_name, predicate in predicate_map:
        for value in graph.objects(uri_ref, predicate):
            lang = getattr(value, "language", None) or "en"
            tag = _field_tag(predicate_name, lang)
            _append_literal_field(auth, tag, value)

    return auth


def _merged(existing_auth, incoming_auth):
    merged_auth = Auth()
    merged_auth.id = existing_auth.id
    incoming_tags = set(incoming_auth.get_tags())
    keep_tags = [
        tag
        for tag in existing_auth.get_tags()
        if tag not in incoming_tags and tag not in SKOS_MERGE_REPLACE_TAGS
    ]

    for tag in keep_tags:
        for field in existing_auth.get_fields(tag):
            merged_auth.fields.append(field)

    for tag in incoming_tags:
        for field in incoming_auth.get_fields(tag):
            merged_auth.fields.append(field)

    # Keep the existing local thesaurus code when replacing SKOS-managed 035 fields.
    merged_tcodes = {value for value in merged_auth.get_values("035", "a") if _is_tcode(value)}
    for tcode in existing_auth.get_values("035", "a"):
        if _is_tcode(tcode) and tcode not in merged_tcodes:
            merged_auth.fields.append(Datafield(tag="035", record_type="auth").set("a", tcode))

    return merged_auth


def _marc_diff_preview(existing_auth, incoming_auth):
    existing_lines = existing_auth.to_mrk().splitlines() if existing_auth else []
    incoming_lines = incoming_auth.to_mrk().splitlines() if incoming_auth else []

    diff_lines = list(
        difflib.unified_diff(
            existing_lines,
            incoming_lines,
            fromfile="existing",
            tofile="incoming",
            lineterm="",
        )
    )

    if not diff_lines:
        return "No MARC changes detected."

    return "\n".join(diff_lines)

@app.cli.command('create-user')
@click.argument('email')
@click.argument('username')
#@click.argument('password', required=False, default=None)
#@click.argument('role', required=False, default='user')
def create_user(email, username):
    my_password = generate_password()
    try:
        user = User(email=email, username=username)
        user.set_password(my_password)
        user.save()
        print(f"User {email} has been created. Password: {my_password}")
        print("Copy the password from here, because this is the only time it will be displayed.")
    except:
        raise

@app.cli.command('make-admin')
@click.argument('email')
def make_admin(email):
    try:
        user = User.objects.get(email=email)

        user.roles = []
        # But only admins should have this one.
        user.add_role_by_name('admin')
        user.save()
    except:
        print("The user doesn't exist or couldn't be saved. You should use the create-user command first.")

@app.cli.command('init-usernames')
def init_usernames():
    for user in User.objects():
        username = user.email.split('@')[0]
        #print(user.email, username)
        user.username = username
        user.save()

@app.cli.command('init-roles')
def init_roles():
    pass
    print("Collecting existing user roles.")
    user_roles = []
    for user in User.objects():
        print(user.email)
        user_role = {'email': user.email, 'roles': []}
        if len(user.roles) > 0:
            for role in user.roles:
                user_role['roles'].append(role)
        user_roles.append(user_role)


    print("Dropping Role and Permission collections.")
    Permission.drop_collection()
    Role.drop_collection()

    # These are only for use by the admin, which has no constraints
    auth_review = Permission(action="reviewAuths")
    auth_review.save()
    merge_auth = Permission(action="mergeAuthority")
    merge_auth.save()

    # basic admin permissions
    admin_permissions = []
    for action in ["create", "read", "update", "delete"]:
        for comp in ["Record", "File", "Workform", "Admin", "Role", "Permission", "User", "View"]:
            this_permission = Permission(action=f'{action}{comp}')
            this_permission.save()
            admin_permissions.append(this_permission)

    import_marc = Permission(action='importMarc')
    batch_delete = Permission(action='batchDelete')
    
    admin_permissions.append(auth_review)
    admin_permissions.append(merge_auth)
    admin_permissions.append(import_marc)
    admin_permissions.append(batch_delete)
    admin_role = Role(name="admin")
    admin_role.permissions = admin_permissions
    admin_role.save()

    # Collection admins
    for coll in ["bibs", "auths", "files"]:
        coll_perms = []
        for action in ["create", "read", "update", "delete"]:
            this_permission = Permission(action=f'{action}Record', constraint_must=[f'{coll}'])
            this_permission.save()
            coll_perms.append(this_permission)
        if coll == "auths":
            # These are the correct, constrained permissions for auth admins
            auth_review = Permission(action="reviewAuths", constraint_must=['auths'])
            auth_review.save()
            merge_auth = Permission(action="mergeAuthority", constraint_must=["auths"])
            merge_auth.save()
            coll_perms.append(auth_review)
            coll_perms.append(merge_auth)
        # collection role
        coll_admin = Role(name=f'{coll}-admin')
        coll_admin.permissions = coll_perms
        coll_admin.save()

    # Location based collection admins
    # NY
    for coll in ["bibs","auths", "files"]:
        coll_perms = []
        for action in ["create", "read", "update", "delete"]:
            ny_permission = Permission(action=f'{action}Record', constraint_must=[f'{coll}|040|a|NNUN'])
            ny_permission.save()
            coll_perms.append(ny_permission)
        # collection role
        coll_admin = Role(name=f'{coll}-NY-admin')
        coll_admin.permissions = coll_perms
        coll_admin.save()

    # GE
    for coll in ["bibs","auths", "files"]:
        coll_perms = []
        for action in ["create", "read", "update", "delete"]:
            ge_permission = Permission(action=f'{action}Record', constraint_must=[f'{coll}|040|a|SzGeBNU'])
            ge_permission.save()
            coll_perms.append(ge_permission)
        # collection role
        coll_admin = Role(name=f'{coll}-GE-admin')
        coll_admin.permissions = coll_perms
        coll_admin.save()    

    # Local Indexer - Not admin
    # NY
    coll_perms = []
    for action in ["create", "read", "update", "delete"]:
        ny_permission = Permission(
            action=f'{action}Record', 
            constraint_must=[f'bibs|040|a|NNUN'], 
            constraint_must_not=[f'biba|999|c|t'])
        ny_permission.save()
        coll_perms.append(ny_permission)
    # collection role
    coll_admin = Role(name=f'bibs-NY-indexer')
    coll_admin.permissions = coll_perms
    coll_admin.save()

    # To do: init the batch admin role

    # Resetting previously existing roles
    for r in user_roles:
        this_u = User.objects.get(email=r["email"])
        this_u.roles = r["roles"]
        this_u.save()

@app.cli.command('create-permission')
@click.argument('action')
@click.option('--constraint_must', default=None, help='Constraints that must be met for this permission to apply, e.g., "bibs|040|a|NNUN"')
@click.option('--constraint_must_not', default=None, help='Constraints that must not be met for this permission to apply, e.g., "biba|999|c|t"')
def create_permission(action, constraint_must=None, constraint_must_not=None):
    try:
        permission = Permission(action=action)
        if constraint_must:
            permission.constraint_must = constraint_must.split(',')
        if constraint_must_not:
            permission.constraint_must_not = constraint_must_not.split(',')
        permission.save()
        print(f"Permission {action} has been created.")
    except Exception as e:
        print(f"Error creating permission: {e}")

'''
This command ensures that all basket items are reflected in the record data.
It also removes baskets whose ownership can no longer be ascertained (e.g., in 
case a user is deleted without clearing their basket first.)
'''
@app.cli.command('align-baskets')
def align_baskets():
    from dlx import DB
    from dlx_rest.models import Basket, User
    import mongoengine

    for b in Basket.objects:
        try:
            owner = b.owner.username
        except mongoengine.errors.DoesNotExist:
            # The user doesn't exist anymore, so we should delete this basket in case it has any records in it
            b.delete()
        except error as e:
            raise e

        print("Aligning basket for", owner)
        for i in b.items:
            print("\tSetting", i['collection'], i['record_id'])
            getattr(DB, i['collection']).update_one(
                {'_id': int(i['record_id'])},
                {'$set': {'basket': owner}}
            )


@app.cli.command("upsert-marc")
@click.argument("uri")
@click.option(
    "--id",
    "record_id",
    type=int,
    default=None,
    help="Auth record ID to update directly. If omitted, match by 035$a URI.",
)
@click.option("--create", is_flag=True, default=False)
@click.option("--auth-control/--no-auth-control", default=True)
@click.option("--diff-preview", is_flag=True, default=False, help="Print MARC diff preview before commit.")
def upsert_marc(uri, record_id, create, auth_control, diff_preview):
    if record_id is not None:
        marc_auth = Auth.from_id(record_id)
    else:
        marc_auth = Auth.from_query(Query(Condition("035", {"a": uri})))

    if marc_auth is not None:
        click.echo(f"Updating {marc_auth.id} with data from {uri}")
        skos_marc = _to_marc(uri, auth_control=auth_control)
        merged_marc = _merged(marc_auth, skos_marc)

        tcode = next(
            (
                identifier
                for identifier in merged_marc.get_values("035", "a")
                if re.match(r"^T\d+$", identifier)
            ),
            None,
        )
        minted = False

        if tcode is None:
            tcode = mint_tcode()
            merged_marc.fields.append(Datafield(tag="035", record_type="auth").set("a", tcode))
            minted = True

        if diff_preview:
            click.echo(_marc_diff_preview(marc_auth, merged_marc))

        merged_marc.commit()

        if minted:
            save_tcode(
                tcode=tcode,
                auth_id=merged_marc.id,
                label=merged_marc.get_value("150", "a"),
                uri=uri,
            )
        return

    if not create:
        click.echo(
            f"Skipping record creation for {uri}. No existing auth match was found and --create was not provided."
        )
        return

    click.echo(f"Creating new auth record from {uri}")
    skos_marc = _to_marc(uri, auth_control=auth_control)
    tcode = mint_tcode()
    skos_marc.set("035", "a", tcode, address=["+"])
    skos_marc.set_008()

    if diff_preview:
        click.echo(_marc_diff_preview(None, skos_marc))

    skos_marc.commit()

    created_auth = Auth.from_query(Query(Condition("035", {"a": tcode})))
    save_tcode(
        tcode=tcode,
        auth_id=created_auth.id if created_auth else "",
        label=skos_marc.get_value("150", "a"),
        uri=uri,
    )