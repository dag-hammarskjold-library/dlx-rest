/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

//import { Jmarc } from "../js/jmarc.js";

/////////////////////////////////////////////////////////////////
// JMARC class definition
/////////////////////////////////////////////////////////////////

"use strict";

//const { memoryUsage } = require("process");

const authMap = {
  "bibs": {
    '191': { 'b': '190', 'c': '190' },
    '600': { 'a': '100', 'g': '100' },
    '610': { 'a': '110', 'g': '110' },
    '611': { 'a': '111', 'g': '111' },
    '630': { 'a': '130', 'g': '130' },
    '650': { 'a': '150' },
    '651': { 'a': '151' },
    '700': { 'a': '100', 'g': '100' },
    '710': { 'a': '110', '9': '110' },
    '711': { 'a': '111', 'g': '111' },
    '730': { 'a': '130' },
    '791': { 'b': '190', 'c': '190' },
    '830': { 'a': '130' },
    '991': { 'a': '191', 'b': '191', 'c': '191', 'd': '191' }
  },
  "auths": {
    //'491': {'a': '191'}, # ?
    '500': { 'a': '100' },
    '510': { 'a': '110' },
    '511': { 'a': '111' },
    '550': { 'a': '150' },
    '551': { 'a': '151' },
  }
};

class Subfield {
  constructor(code, value, xref) {
    this.code = code;
    this.value = value;
    this.xref = xref;
  }
}

class LinkedSubfield extends Subfield {
  constructor(code, value, xref) {
    super(code, value);
    this.xref = xref;
  }
}

class ControlField {
  constructor(tag, value) {
    if (tag) {
      !tag.match(/^00/) && function () { throw new Error("invalid Control Field tag") };
    }

    this.tag = tag;
    this.value = value;
  }
}

class DataField {
  constructor(tag, indicators, subfields) {
    if (tag) {
      tag.match(/^00/) && function () { throw new Error("invalid Data Field tag") };
    }

    indicators ||= [" ", " "];

    this.tag = tag;
    this.indicators = indicators || [];
    this.subfields = subfields || [];
  }

  createSubfield(code) {
    code || function () { throw new Error("subfield code required") };

    let subfield = new Subfield(code);
    this.subfields.push(subfield);

    return subfield;
  }

  getSubfields(code) {
    return this.subfields.filter(x => x.code == code);
  }

  getSubfield(code, place) {
    return this.getSubfields(code)[place || 0];
  }

  toStr() {
    let str = ""

    for (let subfield of this.subfields) {
      str += `\$${subfield.code} ${subfield.value} `;

      if (subfield.xref) {
        str += `@${subfield.xref} `;
      }

      str += '|';
    }

    return str
  }

  lookup() {
    let collection = this instanceof BibDataField ? "bibs" : "auths";
    let lookupString = this.subfields.map(x => { return `${x.code}=${x.value}` }).join("&");
    let url = Jmarc.apiUrl + `marc/${collection}/lookup/${this.tag}?${lookupString}`;

    return fetch(url).then(
      response => {
        return response.json()
      }
    ).then(
      json => {
        let results = json['data'];
        let choices = [];

        for (let auth of results) {
          // each result is a record
          // the wanted auth field is the only 1XX field
          for (let tag of Object.keys(auth).filter(x => x.match(/^1\d\d/))) {
            let field = this instanceof BibDataField ? new BibDataField(this.tag) : new AuthDataField(this.tag);

            for (let sf of auth[tag][0]['subfields']) {
              field.subfields.push(new Subfield(sf['code'], sf['value'], auth['_id']));
            }

            choices.push(field)
          }
        }

        return choices
      }
    )
  }
}

class BibDataField extends DataField {
  constructor(tag, indicators, subfields) {
    super(tag, indicators, subfields)
  }
}

class AuthDataField extends DataField {
  constructor(tag, indicators, subfields) {
    super(tag, indicators, subfields)
  }
}

class Jmarc {
  constructor(collection) {
    Jmarc.apiUrl || function () { throw new Error("Jmarc.apiUrl must be set") };
    this.collection = collection || function () { throw new Error("Collection required") };
    this.collectionUrl = Jmarc.apiUrl + `marc/${collection}`;
    this.recordId = null;
    this.fields = [];
  }

  isAuthorityControlled(tag, code) {
    let map = authMap;

    if (map[this.collection][tag] && map[this.collection][tag][code]) {
      return true
    }

    return false
  }

  static get(collection, recordId) {
    Jmarc.apiUrl || function () { throw new Error("Jmarc.apiUrl must be set") };

    let jmarc = new Jmarc(collection || function () { throw new Error("Collection required") });
    jmarc.recordId = parseInt(recordId) || function () { throw new Error("Record ID required") };
    jmarc.url = Jmarc.apiUrl + `marc/${collection}/records/${recordId}`;

    let savedResponse;

    return fetch(jmarc.url).then(
      response => {
        savedResponse = response;

        return response.json()
      }
    ).then(
      json => {
        if (savedResponse.status != 200) {
          throw new Error(json['message'])
        }

        jmarc.parse(json['data']);
        jmarc.savedState = jmarc.compile();

        return jmarc
      }
    )
  }

  post() {
    if (this.recordId) {
      throw new Error("Can't POST existing record")
    }

    let savedResponse;

    return fetch(
      this.collectionUrl + '/records',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: this.stringify()
      }
    ).then(
      response => {
        savedResponse = response;

        return response.json()
      }
    ).then(
      json => {
        if (savedResponse.status != 201) {
          throw new Error(json['message']);
        }

        this.url = json['result'];
        this.recordId = parseInt(this.url.split('/').slice(-1));
        this.savedState = this.compile()

        return this;
      }
    )
  }

  put() {
    if (!this.recordId) {
      throw new Error("Can't PUT new record")
    }

    let savedResponse;

    return fetch(
      this.url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: this.stringify()
      }
    ).then(
      response => {
        savedResponse = response;

        return response.json();
      }
    ).then(
      json => {
        if (savedResponse.status != 200) {
          throw new Error(json['message'])
        }

        this.savedState = this.compile();

        return this;
      }
    )
  }

  delete() {
    if (!this.recordId) {
      throw new Error("Can't DELETE new record")
    }

    let savedResponse;

    return fetch(
      this.url,
      { method: 'DELETE' }
    ).then(
      response => {
        if (response.status == 204) {
          this.recordId = null;
          this.url = null;

          return this;
        }

        return response.json()
      }
    ).then(
      check => {
        if (check.constructor.name == "Jmarc") {
          return check
        }

        throw new Error(check['message'])
      }
    )
  }

  get saved() {
    return JSON.stringify(this.savedState) === JSON.stringify(this.compile());
  }

  parse(data) {
    this.updated = data['updated']

    let tags = Object.keys(data).filter(x => x.match(/^\d{3}/));
    tags = tags.sort((a, b) => parseInt(a) - parseInt(b));

    for (let tag of tags) {
      for (let field of data[tag]) {
        if (tag.match(/^00/)) {
          let cf = new ControlField(tag, field);
          this.fields.push(cf)
        } else {
          let df = this.collection == "bibs" ? new BibDataField(tag) : new AuthDataField(tag);
          df.indicators = field.indicators.map(x => x.replace(" ", "_"));

          let sf;

          for (let subfield of field.subfields) {
            sf = new Subfield(subfield.code, subfield.value, subfield.xref);
            df.subfields.push(sf)
          }

          this.fields.push(df)
        }
      }
    }

    return this
  }

  compile() {
    let recordData = { '_id': this.recordId }; //, 'updated': this.updated};

    let tags = Array.from(new Set(this.fields.map(x => x.tag)));

    for (let tag of tags.sort(x => parseInt(x))) {
      recordData[tag] = recordData[tag] || [];

      for (let field of this.getFields(tag)) {
        if (field.constructor.name == 'ControlField') {
          recordData[tag].push(field.value);
        } else {
          let fieldData = {};

          fieldData['indicators'] = field.indicators;
          fieldData['subfields'] = field.subfields.map(x => { return { 'code': x.code, 'value': x.value, 'xref': x.xref } });

          recordData[tag].push(fieldData);
        }
      }
    }

    return recordData
  }

  stringify() {
    return JSON.stringify(this.compile())
  }

  createField(tag) {
    tag || function () { throw new Error("tag required") };

    let field;

    if (tag.match(/^00/)) {
      field = new ControlField(tag)
    } else {
      if (this instanceof Bib) {
        field = new BibDataField(tag)
      } else if (this instanceof Auth) {
        field = new AuthDataField(tag)
      }
    }

    this.fields.push(field);

    return field
  }

  getControlFields() {
    return this.fields.filter(x => x.tag.match(/^0{2}/))
  }

  getDataFields() {
    return this.fields.filter(x => !x.tag.match(/^0{2}/))
  }

  getFields(tag) {
    return this.fields.filter(x => x.tag == tag)
  }

  getField(tag, place) {
    return this.getFields(tag)[place || 0]
  }

  getSubfield(tag, code, tagPlace, codePlace) {
    let field = this.getField(tag, tagPlace);

    if (field) {
      return field.getSubfield(code, codePlace);
    }

    return
  }
}

class Bib extends Jmarc {
  constructor() {
    super("bibs");
  }

  static get(recordId) {
    return Jmarc.get("bibs", recordId)
  }

  validate() { }
}

class Auth extends Jmarc {
  constructor() {
    super("auths");
  }

  static get(recordId) {
    return Jmarc.get("auths", recordId)
  }

  validate() { }
}

/////////////////////////////////////////////////////////////////
// MODAL MERGE AUTHORITY COMPONENT
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
let modalmergecomponent = {
  template: `
              <div v-show="visible" class="modal" tabindex="-1">
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Modal title</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                      <p>Modal body text goes here.</p>
                    </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                      <button type="button" class="btn btn-primary">Save changes</button>
                    </div>
                  </div>
                </div>
              </div>
            `
  ,
  data: function () {
    return {
      visible: true
    }
  }
}

/////////////////////////////////////////////////////////////////
// HEADER COMPONENT
/////////////////////////////////////////////////////////////////
let headercomponent = {
  template: `
            <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <a class="navbar-brand" href="#">Editor Menu</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
              <ul class="navbar-nav mr-auto">
                <li class="nav-item active">
                  <a class="nav-link" href="#">Authorities Merge <span class="sr-only">(current)</span></a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#">Feature2</a>
                </li>
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Feature3
                  </a>
                  <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                    <a class="dropdown-item" href="#">Action</a>
                    <a class="dropdown-item" href="#">Another action</a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="#">Something else here</a>
                  </div>
                </li>
                <li class="nav-item">
                  <a class="nav-link disabled" href="#">Feature4</a>
                </li>
              </ul>
              <form class="form-inline my-2 my-lg-0">
                <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
                <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
              </form>
            </div>
          </nav>  
          `
  ,
  data: function () {
    return {
      visible: true
    }
  }
}


/////////////////////////////////////////////////////////////////
// MESSAGE BAR COMPONENT
/////////////////////////////////////////////////////////////////
let messagecomponent = {
  template: `
          <div v-bind:class="styleToDisplay" role="alert">
            <span id="messageText" class="ml-3">{{textToDisplay}}</span>
          </div>
           `
  ,
  created() {
    this.$root.$refs.messagecomponent = this;
  },
  data: function () {
    return {
      visible: true,
      textToDisplay: "Messaging bar", // just insert the string to display
      styleToDisplay: "row alert alert-primary",
      // list of values : // alert alert-primary // alert alert-secondary // alert alert-success // alert alert-danger // alert alert-warning // alert alert-info // alert alert-light // alert alert-dark
    }
  }
  ,
  methods: {
    changeStyling(myText, myStyle) {
      this.textToDisplay = myText
      this.styleToDisplay = myStyle
    }
  }
}
/////////////////////////////////////////////////////////////////
// BASKET COMPONENT
/////////////////////////////////////////////////////////////////
let basketcomponent = {
  props: ["url", "prefix"],
  template: ` 
            <div class="container col-sm-2 mt-3" id="app0" style="background-color:white;" v-show="this.listRecordsTot.length!==0">
            <div class='container mt-3 shadow' style="overflow-y: scroll; height:650px;">
              <div><h4 class="badge bg-success mt-2">Basket <span class="badge badge-light">{{this.listRecordsTot.length}}</span> </h4></div>
              <button type="button" class="btn btn-primary mb-2 mt-3"  v-on:click="clearRecordList">Clear Records list</button>
              <button type="button" class="btn btn-primary mb-2 mt-3" v-show='btnToDisplay' v-on:click='addRecordToList(myRecordId,myCollection,myId,myTitle)'> Undo this action </button>
              <div v-for="record in this.listRecordsTot" :key="record.id" class="list-group" >
                <a href="#" class="list-group-item list-group-item-action" aria-current="true">
                  <div class="d-flex w-100 justify-content-between">
                    <small><span class="mb-1">{{record.collection}}/{{record.record_id}}</span></small>
                    <small><i v-on:click="removeRecordFromList(record.id)" class="far fa-trash-alt"></i></small>
                  </div>
                  <p class="mb-1 text-success">
                    <span :title=record.title v-on:click="displayRecord(record.record_id)">{{record.title.substring(0,45)}}....</span>
                  </p>
                  <p v-if="record.symbol" class="mb-1">
                    <small><span :title=record.symbol>{{record.symbol.substring(0,45)}}....</span></small>
                  </p>
                </a>
              </div>
            </div> 
          </div>
    `,
  created:

    async function () {

      // List of Items
      let listItems = []

      // fetch the data from the api
      let url = this.prefix + this.url

      // retrieving data from API
      let response = await fetch(url);

      // process to fecth data for the full record
      if (response.ok) {
        let myJson = await response.json();

        // Adding the data inside the list
        listItems.push(myJson.data.items)

        // Extracting the data for each items in the list
        for (let item = 0; item < listItems[0].length; item++) {

          // retrieving data from API
          let response1 = await fetch(listItems[0][item]);

          if (response1.ok) {
            let myItem = {}
            let myJson1 = await response1.json();
            myItem.id = myJson1["data"]["id"]
            myItem.record_id = myJson1["data"]["record_id"]
            myItem.collection = myJson1["data"]["collection"]
            myItem.title = myJson1["data"]["title"]
            myItem.symbol = myJson1["data"]["symbol"]
            //console.log(myItem.symbol)
            this.listRecordsTot.push(myItem)

          }

        }

      }


      this.$root.$refs.basketcomponent = this;

    },

  data: function () {
    return {
      visible: true,
      btnToDisplay: false,
      myId: "",
      myRecordId: "",
      myCollection: "",
      myTitle: "",
      listRecordsTot: []
    }
  }
  ,
  methods: {
    // return the id of the record
    getId(recId) {
      let myId = ""
      for (let i = 0; i < this.listRecordsTot.length; ++i) {
        if (this.listRecordsTot[i].record_id == recId) {
          myId = this.listRecordsTot[i].id
        }
      }
      return myId
    },
    // display record 
    displayRecord(myRecord) {
      this.$root.$refs.multiplemarcrecordcomponent.displayMarcRecord(myRecord)
      this.callChangeStyling("Record added to the editor", "row alert alert-success")
    },

    callChangeStyling(myText, myStyle) {
      this.$root.$refs.messagecomponent.changeStyling(myText, myStyle)
    },
    // clear the list of records
    clearRecordList() {

      // retrieving the size of the array
      let sizeArray = this.listRecordsTot.length

      // check if the array is not empty
      if (sizeArray !== 0) {

        for (let i = 0; i < this.listRecordsTot.length; ++i) {
          this.removeRecordFromList(this.listRecordsTot[i].id, false)
        }
        this.callChangeStyling("Basket cleared!!! ", "row alert alert-success")
      }
    }
    ,
    // add a specific record to the basket
    addRecordToList(myRecordId, myCollection, myId, myTitle, verbose = true) {

      // fetch the data from the api
      let url = this.prefix + this.url

      // assign the parameters to the objects 
      let myRecord = {}

      myRecord.id = myId
      myRecord.record_id = myRecordId
      myRecord.collection = myCollection
      myRecord.title = myTitle

      data = `{"collection": "${myCollection}", "record_id": "${myRecordId}", "title": "${myTitle}"}`
      //data=`{"collection": "${myCollection}", "record_id": "${myIndex}"}`

      fetch(url, {
        method: 'POST',
        body: data,
      })
        .then(response => {
          if (response.ok) {
            // add the object to the array
            this.listRecordsTot.push(myRecord)
            this.btnToDisplay = false
            if (verbose) {
              this.callChangeStyling("Item " + myRecordId + "(" + myCollection + ")  added to the basket ", "row alert alert-warning")
            }
          }
        })
        .catch(error => {
          if (verbose) {
            this.callChangeStyling("Oups!!!  Item " + myRecordId + "(" + myCollection + ") not added to the basket ", "row alert alert-danger")
          }
        })
    }
    ,
    // delete a specific record from the basket
    removeRecordFromList(myIndex, verbose = true) {

      // fetch the data from the api
      let url = this.prefix + this.url + "/items/" + myIndex

      fetch(url, {
        method: 'DELETE'
      })
        .then(response => {
          if (response.ok) {

            // delete the value from the array
            for (let i = 0; i < this.listRecordsTot.length; ++i) {
              if (this.listRecordsTot[i].id == myIndex) {
                this.myId = this.listRecordsTot[i].id
                this.myRecordId = this.listRecordsTot[i].record_id
                this.myCollection = this.listRecordsTot[i].collection
                this.myTitle = this.listRecordsTot[i].title
                this.listRecordsTot.splice(i, 1)
                this.btnToDisplay = true
              }
            }
            if (verbose) {
              this.callChangeStyling("Item " + myIndex + ")  deleted from the basket.", "row alert alert-success")
            }
          }
        })
        .catch(error => {
          if (verbose) {
            this.callChangeStyling("Oups!!!  There is an error with this action , item   " + myIndex + " !!!", "row alert alert-danger")
          }
        })
    }
  }
}

/////////////////////////////////////////////////////////////////
// WARNING COMPONENT
/////////////////////////////////////////////////////////////////

let warningcomponent = {
  template: `
  <div v-show="visible" class="container col-sm-2 mt-3" id="app1" style="background-color:white;">
  <div class='container mt-3 shadow' style="overflow-y: scroll; height:650px;">
  <div><h5 class="badge bg-success mt-2">Warning(s) / error(s) </h5></div>
  <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
      <symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </symbol>
      <symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
      </symbol>
      <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </symbol>
  </svg>
  <div class="alert alert-warning d-flex align-items-top" role="alert">
      <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Warning:"></svg>
      <div>
      Lorem Ipsum is simply dummy text. 
      </div>
  </div>
  <div class="alert alert-warning d-flex align-items-top" role="alert">
      <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Warning:"></svg>
      <div>
      Lorem Ipsum is simply dummy text. 
      </div>
  </div>
  <div class="alert alert-danger d-flex align-items-top" role="alert">
      <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"></svg>
      <div>
      Lorem Ipsum is simply dummy text. 
      </div>
  </div> 
  <div class="alert alert-warning d-flex align-items-top" role="alert">
      <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Warning:"></svg>
      <div>
      Lorem Ipsum is simply dummy text. 
      </div>
  </div>
  <div class="alert alert-warning d-flex align-items-top" role="alert">
      <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Warning:"></svg>
      <div>
      Lorem Ipsum is simply dummy text. 
      </div>
  </div>
  <div class="alert alert-warning d-flex align-items-top" role="alert">
      <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Warning:"></svg>
      <div>
      Lorem Ipsum is simply dummy text. 
      </div>
  </div></div>
</div>
</div>`
  ,
  data: function () {
    return {
      visible: true
    }
  }
}

/////////////////////////////////////////////////////////////////
// MARC RECORD COMPONENT
/////////////////////////////////////////////////////////////////

let multiplemarcrecordcomponent = {
  props: {
    prefix: {
      type: String,
      required: true
    },
    records: {
      type: String,
      required: false
    }
  },
  template: `<div class="container col-sm-8 mt-3 " id="app" style="background-color:white;">
              
              <div id="record" class='container mt-3 shadow' style="overflow-y: scroll; height:650px;">
                    <div><h5 class="badge bg-success mt-2">Editor</h5></div>
                    <div v-show="this.isRecordOneDisplayed==false && this.isRecordTwoDisplayed==false" mt-5>
                        <div class="jumbotron jumbotron-fluid">
                            <div class="container">
                              <h1 class="display-4 text-center">No record selected</h1>
                              <p class="lead text-center">please select record from the basket,clicking on the title(green)!!!</p>
                            </div>
                          </div>                                
                    </div>
                    <div id="records" class="row">
                        <div id="record1" v-show="this.isRecordOneDisplayed" class="col-sm-5 ml-3" style="border-left: 5px solid green;border-radius: 5px;"><div><button id="remove1" type="button" class="btn btn-outline-success" v-on:click="removeRecordFromEditor('record1')">Remove this record</button></div></div>
                        <div id="record2" v-show="this.isRecordTwoDisplayed" class="col-sm-5 ml-5" style="border-left: 5px solid green;border-radius: 5px;"><div><button id="remove2" type="button" class="btn btn-outline-success" v-on:click="removeRecordFromEditor('record2')">Remove this record</button></div></div>

                  </div>
              </div>
            </div>
            `,
  data: function () {
    return {
      visible: true,
      record1: "",
      record2: "",
      isRecordOneDisplayed: false,
      isRecordTwoDisplayed: false,
      id: ""
    }
  },
  created() {
    this.$root.$refs.multiplemarcrecordcomponent = this;
    if(this.records) {
      this.records.split(",").forEach(record => {
        var split_rec = record.split("/")
        this.displayMarcRecord(split_rec[1], split_rec[0])
      });
    }
  },
  methods: {
    callChangeStyling(myText, myStyle) {
      this.$root.$refs.messagecomponent.changeStyling(myText, myStyle)
    },

    getIdFromRecordId(recId) {
      this.id = this.$root.$refs.basketcomponent.getId(recId)
    }
    ,
    removeFromBasket(recId) {
      this.getIdFromRecordId(recId)
      this.$root.$refs.basketcomponent.removeRecordFromList(this.id, false)
    },
    removeRecordFromEditor(recordID) {
      /* To do: update the location bar/route to indicate the presence/order of record collection/id pairs */
      // get the parent
      if (recordID === "record1") {
        // remove the div
        let myDiv = document.getElementById("record1")
        myDiv.children[1].remove()
        // reset the parameters
        this.record1 = ""
        this.isRecordOneDisplayed = false
        this.callChangeStyling("Record removed from the editor", "row alert alert-success")
      }
      if (recordID === "record2") {
        let myDiv = document.getElementById("record2")
        // remove the div
        myDiv.children[1].remove()
        // reset the parameters
        this.record2 = ""
        this.isRecordTwoDisplayed = false
        this.callChangeStyling("Record removed from the editor", "row alert alert-success")
      }
    },
    async displayMarcRecord(myRecord, myColl="bibs") {
      /* To do: update the location bar/route to indicate the presence/order of record collection/id pairs */

      // console.log(myRecord)
      // console.log(this.prefix)

      Jmarc.apiUrl = this.prefix

      let display = { "display1": myRecord };

      for (let [div, recId] of Object.entries(display)) {
        Jmarc.get(myColl, recId).then(
          bib => {
            let table = document.createElement("table");

            // some styling for the table
            table.style.width="400px";
            table.style.tableLayout = "fixed";
            table.className="w-auto table-striped"

            let idRow = table.insertRow();
            let idCell = idRow.insertCell();
            idCell.colSpan = 3;
            idCell.innerHTML = "<strong> " + myColl + "/" + recId + "</strong>";

            let saveCell = idRow.insertCell();
            let saveButton = document.createElement("input");
            saveCell.appendChild(saveButton);
            saveButton.type = "button";
            saveButton.value = "save";
            saveButton.className = "btn btn-primary"
            saveButton.onclick = () => {
              bib.put()
              this.callChangeStyling("Record " + recId + " has been updated/saved", "row alert alert-success")
            };

            let deleteCell = idRow.insertCell();
            let deleteButton = document.createElement("input");
            deleteCell.appendChild(deleteButton);
            deleteButton.type = "button";
            deleteButton.value = "delete";
            deleteButton.className = "btn btn-danger"
            deleteButton.onclick = () => {
              bib.delete()
              if (this.record1 === String(recId)) {
                this.removeRecordFromEditor("record1")
              }
              if (this.record2 === String(recId)) {
                this.removeRecordFromEditor("record2")
              }

              this.callChangeStyling("Record " + recId + " has been deleted", "row alert alert-success")
              this.removeFromBasket(recId)
            };

            for (let field of bib.fields.sort((a, b) => parseInt(a.tag) - parseInt(b.tag))) {
              let row = table.insertRow();

              let tagCell = row.insertCell();
              tagCell.innerHTML = field.tag;

              if (field.constructor.name == "ControlField") {
                // controlfield
                row.insertCell(); // placeholder

                let valCell = row.insertCell();
                valCell.innerHTML = field.value;
              } else {
                // datafield
                for (let subfield of field.subfields) {
                  let subRow = table.insertRow()
                  subRow.insertCell(); // placeholder

                  let codeCell = subRow.insertCell();
                  codeCell.innerHTML = subfield.code;

                  // value
                  let valCell = subRow.insertCell();
                  valCell.contentEditable = true; // not used but makes cell clickable

                  let valSpan = document.createElement("span");
                  // update the size of the span
                  valSpan.style.width="100%"
                  valCell.appendChild(valSpan);
                  subfield.valueElement = valSpan; // save the value HTML element in the subfield object
                  valSpan.innerHTML = subfield.value;
                  valSpan.contentEditable = true;
                  valCell.addEventListener("focus", function () { valSpan.focus() });

                  if (bib.isAuthorityControlled(field.tag, subfield.code)) {
                    valSpan.className = "authority-controlled"; // for styling

                    // xref
                    let xrefCell = subRow.insertCell();
                    subfield.xrefElement = xrefCell; // save the xref HTML element in the subfield object
                    //xrefCell.innerHTML = subfield.xref;
                    let xrefLink = document.createElement("a");
                    xrefCell.appendChild(xrefLink);
                    xrefLink.text = subfield.xref;
                    xrefLink.href = `${Jmarc.apiUrl}marc/auths/records/${subfield.xref}?format=mrk`;
                    xrefLink.target="_blank"

                    // lookup
                    let timer;

                    valCell.addEventListener(
                      "keyup",
                      function (event) {
                        if (event.keyCode < 45 && event.keyCode !== 8) {
                          // non ascii or delete keys
                          return
                        }

                        valSpan.style.backgroundColor = "red";
                        xrefCell.innerHTML = null;

                        let popup = document.getElementById("typeahead-popup");
                        popup && popup.remove();

                        clearTimeout(timer);
                        subfield.value = valCell.innerText;

                        if (subfield.value) {
                          timer = setTimeout(
                            function () {
                              let popup = document.createElement("div");
                              valCell.appendChild(popup);
                              popup.id = "typeahead-popup";
                              popup.innerHTML = "searching...";

                              field.lookup().then(
                                choices => {
                                  if (choices.length == 0) {
                                    popup.innerHTML = "not found :(";
                                    setTimeout(function () { popup.remove() }, 1000)
                                    return
                                  }

                                  popup.innerHTML = null;

                                  let list = document.createElement("ul");
                                  popup.appendChild(list);

                                  for (let choice of choices) {
                                    let item = document.createElement("li");
                                    list.appendChild(item);
                                    item.innerHTML = choice.subfields.map(x => `$${x.code} ${x.value}`).join(" ");

                                    item.addEventListener(
                                      "mouseover",
                                      function () { item.style.backgroundColor = "gray" }
                                    );

                                    item.addEventListener(
                                      "mouseout",
                                      function () {
                                        item.style.backgroundColor = "white";
                                        subfield.value = valSpan.innerText
                                      }
                                    )

                                    item.addEventListener(
                                      "mousedown",
                                      function () {
                                        popup.remove()

                                        for (let newSubfield of choice.subfields) {
                                          let currentSubfield = field.getSubfield(newSubfield.code);

                                          currentSubfield.value = newSubfield.value;
                                          currentSubfield.xref = newSubfield.xref;

                                          currentSubfield.valueElement.innerHTML = currentSubfield.value;
                                          currentSubfield.valueElement.style.backgroundColor = "white";
                                          currentSubfield.xrefElement.innerHTML = currentSubfield.xref;
                                        }
                                      }
                                    )
                                  }
                                }
                              )
                            },
                            750
                          );
                        }
                      }
                    )
                  }

                  valCell.addEventListener(
                    "blur",
                    function () {
                      subfield.value = valSpan.innerText;
                      console.log(`user entered value "${subfield.value}"`);

                    }
                  );

                  valCell.addEventListener(
                    "keydown",
                    function (event) {
                      if (event.keyCode === 13) {
                        // return key
                        event.preventDefault();
                        valCell.blur();
                      }
                    }
                  );

                }
              }
            }
            if (this.isRecordOneDisplayed == false) {
              let myRecord1 = document.getElementById("record1");
              myRecord1.appendChild(table)
              this.isRecordOneDisplayed = true
              this.record1 = myRecord
            }
            else if
              (this.isRecordTwoDisplayed == false) {
              let myRecord2 = document.getElementById("record2");
              myRecord2.appendChild(table)
              this.isRecordTwoDisplayed = true
              this.record2 = myRecord
            }


            // myRecord.appendChild(table);
            // myRecord.id = "record"+myRecord.recId;
          }

        );

      }

    }
   }
}

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
let vm_new_ui_component = new Vue({
  el: '#new_ui_component',
  components: { headercomponent, basketcomponent, warningcomponent, multiplemarcrecordcomponent, messagecomponent, modalmergecomponent },
  data: {
    visible: false,
    recordToDisplay: "",
    recordDisplayed: [],
    maxRecordToDisplay: 26,
    records: []
  },
  methods: {}
})