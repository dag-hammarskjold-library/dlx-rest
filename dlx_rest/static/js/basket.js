/////////////////////////////////////////////////////////////////
// BASKET COMPONENT
/////////////////////////////////////////////////////////////////
export let basketcomponent = {
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
                      <span :title=record.title v-on:click="displayRecord(record.record_id, record.collection)">{{record.title.substring(0,45)}}....</span>
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
      displayRecord(myRecord, myCollection) {
        this.$root.$refs.multiplemarcrecordcomponent.displayMarcRecord(myRecord, myCollection)
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
  
<<<<<<< HEAD
        let data = `{"collection": "${myCollection}", "record_id": "${myRecordId}", "title": "${myTitle}"}`
=======
        data = `{"collection": "${myCollection}", "record_id": "${myRecordId}", "title": "${myTitle}"}`
>>>>>>> 4e6d307a36a39c31e6cfd2013a34a4fba359ee30
  
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
            // if not ok
            if (!response.ok) {
              this.callChangeStyling("Oups!!!  Item not added to the basket ", "row alert alert-danger")
            }
          })
          .catch(error => {
            if (verbose) {
              this.callChangeStyling("Oups!!!  Item not added to the basket ", "row alert alert-danger")
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
                this.callChangeStyling("Item " + this.myRecordId + "  deleted from the basket.", "row alert alert-success")
              }
            }
            // if not ok
            if (!response.ok) {
              this.callChangeStyling("Oups!!!  There is an error with this action!!!", "row alert alert-danger")
            }
          })
          .catch(error => {
            if (verbose) {
              this.callChangeStyling("Oups!!!  There is an error with this action!!!", "row alert alert-danger")
            }
          })
      }
    }
  }