from flask import Flask, render_template, jsonify, request, redirect, abort, Response
from .config import DB
from bson.objectid import ObjectId
from bson.json_util import dumps
import json, bson

app = Flask(__name__)

@app.route('/')
def index():
    collection = DB.bibRecords
    records = collection.find({}).limit(10)
    return_records = []
    for record in records:
        return_records.append(str(record['_id']))
    return render_template('index.html', records=return_records)

@app.route('/bib/<id>')
def get_by_id(id):
    collection = DB.bibRecords
    try:
        record = collection.find_one({'_id': ObjectId(id)})
        return Response(dumps(record), mimetype='application/json')
    except bson.errors.InvalidId:
        abort(404)