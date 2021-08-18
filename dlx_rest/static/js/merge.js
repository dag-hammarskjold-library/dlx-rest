/////////////////////////////////////////////////////////////////
// IMPORTS
/////////////////////////////////////////////////////////////////
import { multiplemarcrecordcomponent } from "./record.js";


/////////////////////////////////////////////////////////////////
// MODAL MERGE AUTHORITY COMPONENT
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
let vm=""
export let modalmergecomponent = {
	template:`
          <!-- The Modal -->
  
                <div v-show="modal" class="container mb-2 bg-white text-dark" style="width:40%;" >
                    <div class="jumbotron mt-3 mb-3">
                    <h1>Authorities merge feature</h1>
                    <hr>
                    <p>Please select the targeted record</p>
                    <select class="form-select" name="pets" id="selectElementId" v-on:click="loadRecordId()">
                      <option value="">--Please choose an option--</option>

                    </select>
                    <hr>
                    <button v-on:click="modal=false" type="button" class="btn btn-secondary">Close</button>
                    <button type="button" class="btn btn-success">Merge</button>
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
   toggleModal(){
     if (multiplemarcrecordcomponent.methods.canDisplay()) {
     return vm.modal=!vm.modal
     } 
   },
   loadRecordId(){
      if (multiplemarcrecordcomponent.methods.canDisplay()) {
          alert("here")
          console.log("record1:  " + multiplemarcrecordcomponent.recup.record1)
          let select = document.getElementById('selectElementId');  
          
          // adding the first record Id
          let opt = document.createElement('option');
          opt.value = 1;
          opt.innerHTML = multiplemarcrecordcomponent.recup.record1;
          select.appendChild(opt); 

        // adding the second record Id
        opt = document.createElement('option');
        opt.value = 2;
        opt.innerHTML = multiplemarcrecordcomponent.recup.record2;
        select.appendChild(opt); 
      } 
   }
  }
}
  