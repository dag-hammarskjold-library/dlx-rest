/////////////////////////////////////////////////////////////////
// HEADER COMPONENT
/////////////////////////////////////////////////////////////////
let headercomponent = {
  template:`
            <nav class="navbar navbar-expand-lg navbar-light mt-3 mb-2" style="background-color: #e3f2fd;">         
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
              <div class="navbar-nav">
                <a class="nav-item nav-link active" href="#">Feature0</a>
                <a class="nav-item nav-link" href="#">Feature1</a>
                <a class="nav-item nav-link" href="#">Feature2</a>
                <a class="nav-item nav-link" href="#">Feature3</a>
                <a class="nav-item nav-link" href="#">Feature4</a>
                <a class="nav-item nav-link" href="#">Feature5</a>
                <a class="nav-item nav-link" href="#">Feature6</a>
                <a class="nav-item nav-link" href="#">Feature7</a>
                <a class="nav-item nav-link" href="#">Feature8</a>
                <a class="nav-item nav-link" href="#">Feature9</a>
                <a class="nav-item nav-link disabled" href="#" tabindex="-1" aria-disabled="true">Disabled</a>
              </div>
            </div>
          </nav>`
}


/////////////////////////////////////////////////////////////////
// BASKET COMPONENT
/////////////////////////////////////////////////////////////////
let basketcomponent = {
  template:` <div class="container col-lg-2 mt-3" id="app0" style="background-color:white;">
            <div class='container mt-3 shadow' style="overflow-y: scroll; height:900px;" >
              <div><h4 class="badge bg-success mt-2">Basket </h4></div>
              <button type="button" class="btn btn-primary mb-2 mt-3">Clear Records list</button>
              <div class="list-group">
                <a href="#" class="list-group-item list-group-item-action" aria-current="true">
                  <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">1278539</h5>
                    <small><i class="far fa-trash-alt"></i></small>
                  </div>
                  <p class="mb-1">
                  My 245 field here
                  </p>
                  <small>BIB Collection</small>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                  <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">127853</h5>
                    <small class="text-muted"><i class="far fa-trash-alt"></i></small>
                  </div>
                  <p class="mb-1">
                    My 245 field here
                  </p>
                  <small class="text-muted">BIB Collection</small>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                  <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">1278474</h5>
                    <small class="text-muted"><i class="far fa-trash-alt"></i></small>
                  </div>
                  <p class="mb-1">
                    My 245 field here
                  </p>
                  <small class="text-muted">BIB Collection</small>
                </a>
              </div>
            </div> 
          </div>`,
  data:function(){
    return {
      listRecords:[]
    }
  },
  methods:{
    // clear the list of records
    clearRecordList(){
        listRecords=[]      
    },
    // delete a specific record
    removeRecordFromList(myIndex){
      delete listRecords[myIndex]      
  }



  }
}

/////////////////////////////////////////////////////////////////
// WARNING COMPONENT
/////////////////////////////////////////////////////////////////

let warningcomponent = {
  template:`
  <div class="container col-lg-2 mt-3" id="app1" style="background-color:white;">
  <div class='container mt-3 shadow' style="overflow-y: scroll; height:900px;">
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
}

/////////////////////////////////////////////////////////////////
// MARC RECORD COMPONENT
/////////////////////////////////////////////////////////////////

let multiplemarcrecordcomponent = {
  props:{
      urls:{
        type: String,
        required: true
      }
  },
  template:`<div class="container col-lg-7 mt-3 " id="app" style="background-color:white;">
            <div class='row container mt-3 shadow' style="overflow-y: scroll; height:900px;">
                
                <div v-for="record in $parent.records" class="w-25 overflow-auto col-5 ml-3 mr-3 mt-3 mb-3 border-success bg-gradient border-3 border-start shadow-lg">
                    <h4 class='mt-3'> Record ID : {{record['myId']}} </h4>
                    <h6 class="text-success"> Last update :  {{record['myUpdated']}} </h6>
                    <hr>
                    <div class="border border-2" v-if="mtr.myTag !=='' " v-for="mtr in record['myTagRecord']">     
                         <span class='badge rounded-pill bg-secondary'> {{mtr.myTag}}</span> <span> {{mtr.myHeader}}</span> <span> {{mtr.myIndicators}}</span> 
                         <span v-for="sub in mtr.mySubFields">
                            <span class="text-primary fw-bold" ><br>$</span><span class="text-primary fw-bold">{{sub.code}}</span> <span>{{sub.value}} |</span> <span class="text-success fw-bold" v-if="sub.xref"> {{"@@@" + sub.xref}} </span>
                         </span>
                    </div>
                </div>
            </div> </div>
            `,
  created: async function(){
       
    // Retrieving the url inside an array
    let myUrls= this.urls.split(",");
    
    // Retrieve the number of url
    let mySize=myUrls.length
    
    // Loop the array of URLS
    for (i = 0; i < mySize; i++) {

      let myRecord={ 
        myId:"",
        myUpdated:"",
        myTagRecord:[
          {
            myTag:"",
            myHeader:"",
            myIndicators:[
            {
              myIndicator1:"",
              myIndicator2:""
            }
          ],
            mySubFields:[
              {
                myCode:"",
                myValue:"",
                myXref:""
              }
            ]
          }
        ]
      }
      

      // retrieving data from API
      let response = await fetch(myUrls[i]);
    
      // process to fecth data for the full record
      if (response.ok) {
          let myJson= await response.json();

          // assign the ID value
          myRecord.myId=myJson["data"]['_id'];

          // assign the updated value
          myRecord.myUpdated=myJson["data"]['updated'];
          
          // Retrieve the value of the tag
          let mylistTags=Object.keys(myJson["data"]).sort()
          
          // Loop to display the tags and the values
          for (j = 0; j < mylistTags.length; j++){

              if (mylistTags[j]!=="_id" && mylistTags[j]!=="updated"  && mylistTags[j]!=="files"){
                
                // assign the tag value
                myTag=mylistTags[j]

                // Save the record
                // let saveRecord={}
                
                // size of the tag record array
                let sizeTagRecord = myJson["data"][myTag].length

                  // loop inside the tag record array
                  for (k = 0; k < sizeTagRecord; k++){                
                    
                    let saveRecord={}
                    saveRecord.myTag=myTag

                    // header case
                    if (myTag){
                        if (parseInt(myTag)==parseInt('000') || parseInt(myTag)==parseInt('001') || parseInt(myTag)==parseInt('002') || parseInt(myTag)==parseInt('003') || parseInt(myTag)==parseInt('004') || parseInt(myTag)==parseInt('005') || parseInt(myTag)==parseInt('007') || parseInt(myTag)==parseInt('008')) {
                          saveRecord.myHeader=myJson["data"][myTag]
                        } 
                        // rest of the tag
                        else {
                          myIndicators=myJson["data"][myTag][k]["indicators"]
                          mySubFields=myJson["data"][myTag][k]["subfields"]
                          
                          // save value
                          saveRecord.myIndicators=myIndicators
                          saveRecord.mySubFields=mySubFields
                        }
                      }
                    myRecord.myTagRecord.push(saveRecord)
                  }
              }
          }
      } 
      vm_new_ui_component.records.push(myRecord)
    }
  }
}

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
let vm_new_ui_component = new Vue({
  el:'#new_ui_component',
  components:{headercomponent,basketcomponent,warningcomponent,multiplemarcrecordcomponent},
      data:{
        visible:false,
        records:[]
      },
      methods:{}
})