/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

import { Jmarc } from "../js/jmarc.mjs";


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