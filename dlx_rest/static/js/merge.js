/////////////////////////////////////////////////////////////////
// IMPORTS
/////////////////////////////////////////////////////////////////
import { multiplemarcrecordcomponent } from "./record.js";
import { messagecomponent } from "./messagebar.js";


/////////////////////////////////////////////////////////////////
// MODAL MERGE AUTHORITY COMPONENT
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
let vm=""
export let modalmergecomponent = {

  props: ["prefix"],

	template:`
          <!-- The Modal -->
  
                <div v-show="modal" class="container mb-2 bg-white text-dark" style="width:40%;" >
                    <div class="jumbotron mt-3 mb-3">
                    <h1>Authorities merge feature</h1>
                    <hr>
                    <p>Please select the gaining record</p>
                    <select class="form-select" name="mergerecord" id="selectElementId">
                    </select>
                    <hr>
                    <button v-on:click="modal=false" type="button" class="btn btn-secondary">Close</button>
                    <button type="button" class="btn btn-success" v-on:click="mergeAuthorities" >Merge</button>
                    </div>
                </div>

  `,
  created(){
    vm=this;
  }
  ,
  data: function(){
    return { 
      modal : false            
    }
 },        
 methods: {
    callChangeStyling(myText, myStyle) {
      this.$root.$refs.messagecomponent.changeStyling(myText, myStyle)
    },
   mergeAuthorities(){

    // define the gaining
    let myVal=[] 
    let gaining=""
    let losing=""
    let vm=this

    // getting the Ids of the records  
    myVal=multiplemarcrecordcomponent.methods.getRecords()

    // getting the select object
    let select = document.getElementById('selectElementId');  
    let value  = select.options[select.selectedIndex].text;

    // defining the gaining and the losing 
    if (parseInt(value)===myVal[0]) {
       gaining=myVal[0]
       losing=myVal[1] 
    }
    
    if (parseInt(value)===myVal[1]) {
      gaining = myVal[1]
      losing = myVal[0] 
    }

     // fetch the data from the api
     let url = this.prefix + "marc/auths/records/" + gaining +"/merge?target=" + losing

     fetch(url, {
       method: 'GET'
     })
       .then(response => {
         if (response.ok) {
            vm.callChangeStyling("Authorities merged","d-flex w-100 alert-success")
            //reload the basket 
            try
            {
              location.reload();
            }
            catch (error){
              vm.callChangeStyling(error.message,"d-flex w-100 alert-danger")
            }
             }
          if (!response.ok) {
          response.json()
              .then(json => {
                vm.callChangeStyling(json.message,"d-flex w-100 alert-danger")
              });
          }
           }
       )
       .catch(error => {
          vm.callChangeStyling(error.message,"d-flex w-100 alert-danger")
       })
   }
   ,
   toggleModal(){
     if (multiplemarcrecordcomponent.methods.canDisplay()) {
      if (!this.vm) this.loadRecordId() 
     return vm.modal=!vm.modal
     } 
   },
   loadRecordId(){
      if (multiplemarcrecordcomponent.methods.canDisplay()) {

          let myVal=[] 
          myVal=multiplemarcrecordcomponent.methods.getRecords()
          
          let select = document.getElementById('selectElementId');  

          // clear select
          select.innerText = null;
          
          //adding the first record Id
          let opt = document.createElement('option');
          opt.value = 1;
          opt.innerHTML = myVal[0];
          select.appendChild(opt); 

          // adding the second record Id
          opt = document.createElement('option');
          opt.value = 2;
          opt.innerHTML = myVal[1];
          select.appendChild(opt); 


      } 
   }
  }
}
  