let recup=""
/////////////////////////////////////////////////////////////////
// IMPORT
/////////////////////////////////////////////////////////////////
 
import { Jmarc } from "./jmarc.mjs";
import user from "./api/user.js";
import basket from "./api/basket.js";
import { basketcomponent } from "./basket.js";
 
/////////////////////////////////////////////////////////////////
// MARC RECORD COMPONENT
/////////////////////////////////////////////////////////////////
 
export let multiplemarcrecordcomponent = {
    props: {
        prefix: {
            type: String,
            required: true
        },
        records: {
            type: String,
            required: false
        },
        workform: {
            type: String,
            required: false
        },
        readonly: {
            type: Boolean,
            default: false
        },
        fromworkform: {
            type: String,
            required: false
        }
    },
    template: `
        <div class="container col-sm-10" id="app1" style="background-color:white;">
            <div class='mt-3 shadow'>
                <div v-show="this.isRecordOneDisplayed==false && this.isRecordTwoDisplayed==false" mt-5>
                    <div class="ml-3 mr-3 mt-3 jumbotron jumbotron-fluid">
                        <div class="container">
                            <p v-if="recordlist.length > 0" class="fa fa-5x fa-spinner"></p>
                            <p v-else class="text-center">No record selected</p>
                        </div>
                    </div>                               
                </div>
                <div id="records" class="row ml-3">
                    <div id="record1" v-show="this.isRecordOneDisplayed" class="col-sm-6 mt-1 div_editor" style="overflow-y: scroll; height:650px;">
                        <!-- <div>
                            <button v-if="readonly" id="remove1" type="button" class="btn btn-outline-success mb-2" style="display:none" v-on:click="removeRecordFromEditor('record1')">Remove this record</button>
                            <button v-else id="remove1" type="button" class="btn btn-outline-success mb-2" v-on:click="removeRecordFromEditor('record1')">Remove this record</button>
                        </div> -->
                    </div>
                    <div id="record2" v-show="this.isRecordTwoDisplayed" class="col-sm-6 mt-1 div_editor" style="overflow-y: scroll; height:650px;">
                        <!-- <div>
                            <button v-if="readonly" id="remove2" type="button" class="btn btn-outline-success mb-2" style="display:none" v-on:click="removeRecordFromEditor('record2')">Remove this record</button>
                            <button v-else id="remove2" type="button" class="btn btn-outline-success mb-2" v-on:click="removeRecordFromEditor('record2')">Remove this record</button>
                        </div> -->
                    </div>
                    <br>&nbsp;
                </div>
            </div>
        </div>
    `,
 
    data: function () {
        return {
            visible: true,
            record1: "",
            record2: "",
            recordlist: [],
            collectionRecord1:"",
            collectionRecord2:"",
            isRecordOneDisplayed: false,
            isRecordTwoDisplayed: false,
            displayedJmarcObject:[],
            listElemToCopy:[],
            elementToCopy:{
                collection:"",
                recordIdToCopy:"",
                fieldToCopy:""
            },
            id: "",
            user: null,
            myBasket: null,
            targetedTable:"",
            selectedRecord:"",
            selectedDiv:"",
            selectedJmarc:"",
            selectedFields:[],
            recordLocked: {"locked": false}
        }
    },

    created: 
    async function() {
    
    //////////////////////////////////////////////////////////////////////////
    // Management of the keyboard shortcuts
    //////////////////////////////////////////////////////////////////////////
    
    window.addEventListener("keydown", this.removeRecordListener)    // ctrl + f4 => close the record selected
    window.addEventListener("keydown", this.saveRecordListener)      // ctrl + s => save the record selected
    window.addEventListener("keydown", this.addFieldListener)        // ctrl + ENTER => add a new field to the record selected
    window.addEventListener("keydown", this.addHelpListener)         // ctrl + h => show the help window about the shortcuts
    window.addEventListener("keydown", this.deleteFieldListener)     // ctrl + k => remove a field from the record selected
    window.addEventListener("keydown", this.addSubFieldListener)     // ctrl + / => add a subfield to the selected record
    window.addEventListener("keydown", this.deleteSubFieldListener)  // ctrl + m => remove a subfield from the selected record
    window.addEventListener("keydown", this.pasteFieldListener)      // ctrl + p => past the selected field
    window.addEventListener("keydown", this.changeSelectedRecordListener)  // ctrl + q => change the selected record
    
    //////////////////////////////////////////////////////////////////////////
 
        Jmarc.apiUrl = this.prefix;
        this.baseUrl = this.prefix.replace("/api", "");
       
        this.copiedFields = [];
        this.$root.$refs.multiplemarcrecordcomponent = this;
 
        user.getProfile(this.prefix, 'my_profile').then(
            myProfile => {
                this.user = myProfile.data.email;
                
                basket.getBasket(this.prefix).then(
                    myBasket => this.myBasket = myBasket
                )
            }
        ).then( () => {
            // the "records" param from the URL
            if (this.records !== "None") {
                // "<col>/<id>"
                this.recordlist = this.records.split(","); 

                for (let record of this.recordlist) {
                    let collection = record.split("/")[0]
                    let recordId = record.split("/")[1]
                
                    Jmarc.get(collection, recordId).then(async jmarc => {
                        if (this.readonly && this.user !== null) {
                            //this.recordLocked = await basket.itemLocked(this.prefix, jmarc.collection, jmarc.recordId);
                            basket.itemLocked(this.prefix, jmarc.collection, jmarc.recordId).then( () => {
                                this.displayMarcRecord(jmarc, true)
                            })
                            
                        } else if (this.user === null) {
                            this.displayMarcRecord(jmarc, true);
                        } else {
                            this.displayMarcRecord(jmarc);
                        }
                    })
                }
            } else if (this.workform !== 'None') {
                let wfCollection = this.workform.split('/')[0];
                let wfRecordId = this.workform.split('/')[1]
                
                //let jmarc = await Jmarc.fromWorkform(wfCollection, wfRecordId);
                Jmarc.fromWorkform(wfCollection, wfRecordId).then( jmarc => {
                    this.displayMarcRecord(jmarc, false);
                })
                
            } else if (this.fromworkform !== 'None') {
                // Create a record from a workform. This makes the method directly navigable, e.g., for the menu
                let wfCollection = this.fromworkform.split('/')[0];
                let wfRecordId = this.fromworkform.split('/')[1]
                //console.log(wfCollection, wfRecordId)
                
                //let jmarc = await Jmarc.fromWorkform(wfCollection, wfRecordId);
                Jmarc.fromWorkform(wfCollection, wfRecordId).then( jmarc => {
                    jmarc.workformName = this.fromworkform
                    //this.displayMarcRecord(jmarc, false);
                    this.cloneRecord(jmarc)
                })
                
            }
            recup=this
        })
        
        
    },
    methods: {
 
        // add a new jmarc object in the array of Marc objects
        addJmarcTodisplayedJmarcObject(jmarcToAdd){
            if ((this.displayedJmarcObject.length===0) || (this.displayedJmarcObject.length===1)){
                this.displayedJmarcObject.push(jmarcToAdd)   
                }
            }
        ,
 
        // remove a jmarc object from the array of Marc objects
        removeJmarcTodisplayedJmarcObject(recordId){
            let indexToDelete
            for (let index = 0; index < this.displayedJmarcObject.length; index++) {
               if (recordId===this.displayedJmarcObject[index].recordId){
                    indexToDelete=index
               }
            }
            this.displayedJmarcObject.splice(indexToDelete,1)
        }
        ,
 
        ////////////////////////////////////////////////////////
        ///// definition of the methods used in the listeners
        ////////////////////////////////////////////////////////

        saveRecord(jmarc){
            if (jmarc.workformName) {
                jmarc.saveWorkform(jmarc.workformName, jmarc.workformDescription).then( () => {
                    this.removeRecordFromEditor(jmarc); // div element is stored as a property of the jmarc object
                    this.displayMarcRecord(jmarc, false);
                    this.callChangeStyling(`Workform ${jmarc.collection}/workforms/${jmarc.workformName} saved.`, "row alert alert-success")
                });
            } else if (! jmarc.saved) {
                let promise = jmarc.recordId ? jmarc.put() : jmarc.post();
                
                jmarc.saveButton.classList.add("fa-spinner");
                jmarc.saveButton.style = "pointer-events: none";
 
                promise.then(jmarc => {
                    jmarc.saveButton.classList.remove("fa-spinner");
                    jmarc.saveButton.style = "pointer-events: auto";
                    this.removeRecordFromEditor(jmarc); // div element is stored as a property of the jmarc object
                    this.displayMarcRecord(jmarc, false);
                    this.callChangeStyling("Record " + jmarc.recordId + " has been updated/saved", "row alert alert-success")
                    basket.createItem(this.prefix, "userprofile/my_profile/basket", jmarc.collection, jmarc.recordId)
                    
                    for (let field of jmarc.fields.filter(x => ! x.tag.match(/^00/))) {
                        for (let subfield of field.subfields) {
                            subfield.copied = false;
                        }
                    }
                    //this.selectRecord(jmarc)
                }).catch(error => {
                    jmarc.saveButton.classList.remove("fa-spinner");
                    jmarc.saveButton.style = "pointer-events: auto";
                    this.callChangeStyling(error.message.substring(0, 100), "row alert alert-danger");
                });
            }
        },
        cloneRecord(jmarc) {
            let recup = jmarc.clone();
            if (jmarc.divID) {
                this.removeRecordFromEditor(jmarc); // div element is stored as a property of the jmarc object
            }
            if (jmarc.workformName) {
                this.callChangeStyling("Workform " + jmarc.workformName + " has been cloned and removed from the editor. Displaying new record", "row alert alert-success")
            } else {
                this.callChangeStyling("Record " + jmarc.recordId + " has been cloned and removed from the editor. Displaying new record", "row alert alert-success")
            }
           
            this.displayMarcRecord(recup, false);
            // Adding to basket happens now whenever the record is saved.
            //basket.createItem(this.prefix, "userprofile/my_profile/basket", jmarc.collection, recup.recordId)
            recup.saveButton.classList.add("text-danger");
            //recup.saveButton.classList.remove("text-primary");
            recup.saveButton.title = "unsaved changes";
           
            for (let field of recup.fields) {
                if (! field.tag.match(/^00/)) {
                    for (let subfield of field.subfields) {
                        subfield.valueCell.classList.add("unsaved");
                    }
                }
            }
 
        },
        // undo feature
        moveUndoredoIndexUndo(jmarc){
            jmarc.moveUndoredoIndexUndo()
            this.removeRecordFromEditor(jmarc,true)
            this.displayMarcRecord(jmarc,false,true)           
        },

        // redo feature
        moveUndoredoIndexRedo(jmarc){
            jmarc.moveUndoredoIndexRedo()
            this.removeRecordFromEditor(jmarc,true)
            this.displayMarcRecord(jmarc,false,true)      
        },

        pasteField(jmarc){
            // paste field   
            this.selectedFields.forEach(field =>
                {
                    for (let field of this.copiedFields || []) {
                        // recreate the field
                        let newField = jmarc.createField(field.tag);
                        newField.indicators = field.indicators || ["_", "_"];
                       
                        for (let subfield of field.subfields) {
                            let newSubfield = newField.createSubfield(subfield.code);
                            newSubfield.value = subfield.value;
                            newSubfield.xref = subfield.xref;
                            newSubfield.copied = true;
                        }
                    }
                   
                    // clear the list of copied items
                    this.copiedFields = [];
                   
                    // clear all checkboxes
                    for (let checkbox of document.getElementsByClassName("field-checkbox")) {
                        checkbox.checked = false;
                    }
                   
                    // refresh   
                    this.removeRecordFromEditor(jmarc);
                    this.displayMarcRecord(jmarc);
                   
                    for (let field of jmarc.fields.filter(x => ! x.tag.match(/^00/))) {
                        for (let subfield of field.subfields.filter(x => x.copied)) {
                            // subfield acquires valueCell after refresh
                            subfield.valueCell.classList.add("unsaved")
                        }
                    }
                    
                    jmarc.saveButton.classList.add("text-danger");
                    jmarc.saveButton.title = "Save Record";
                })
                               
        },
        deleteSubFieldFromShort(jmarc){
            // delete subfield   
            this.selectedFields.forEach(field =>
                {
                    if (field.subfields.length == 1) {
                        this.callChangeStyling("Can't delete the field's only subfield", "row alert alert-danger");
                        return
                    }
                    // the subfield will be the last of the subfields array
                    let subfield=field.subfields[field.subfields.length-1]
                   
                    // Remove the subfield from the field
                    field.deleteSubfield(subfield);
                    // Remove the subfield row from the table
                    field.table.deleteRow(subfield.row.rowIndex);
   
                    // Manage visual indicators
                    if (jmarc.saved) {
                        jmarc.saveButton.classList.remove("text-danger");
                        jmarc.saveButton.classList.add("text-primary");
                        jmarc.saveButton.title = "no new changes";
                    } else {
                        jmarc.saveButton.classList.add("text-danger");
                        jmarc.saveButton.classList.remove("text-primary");
                        jmarc.saveButton.title = "save";
                    }
 
                })
                              
        },
        addSubField(){
            // add blank subfield
            this.selectedFields.forEach(field=>
                {
                    let place = field.subfields.length;
                    let newSubfield = field.createSubfield("_", place);
                    newSubfield.value = "";
                    newSubfield = this.buildSubfieldRow(newSubfield, place);
           
                    newSubfield.codeSpan.focus();
                    document.execCommand("selectall");
           
                    newSubfield.valueCell.classList.add("unsaved");
                    saveButton.classList.add("text-danger");
                    saveButton.classList.remove("text-primary");
                    saveButton.title = "unsaved changes";
 
            })
        },
        addField(jmarc){
            // Add blank field
            this.selectedFields.forEach(field=>
                {
                let newField = jmarc.createField("___", (field.row.rowIndex - 2 /*2 header rows*/) + 1);
                newField.indicators = ["_", "_"];
       
                let newSubfield = newField.createSubfield();
                newSubfield.code = "_";
                newSubfield.value = "";
       
                newField = this.buildFieldRow(newField, field.row.rowIndex - 1);
                newField.tagSpan.focus();
                document.execCommand("selectall");
                newField.subfields[0].valueCell.classList.add("unsaved");

            })
 
            // Manage visual indicators
            jmarc.saveButton.classList.add("text-danger");
            jmarc.saveButton.title = "Save Record";

            // undoredo snapshot
            //jmarc.addUndoredoEntry("ADD FIELD") 
        },
        deleteField(jmarc){
            // delete the field
            this.selectedFields.forEach(field=>
                {
                    if (jmarc.fields.length === 1) {
                        // this is the record's only field
                        this.callChangeStyling("Can't delete record's only field", "row alert alert-danger")                       
                        return
                    }                   
                    jmarc.deleteField(field);
                    let myTable=document.getElementById(this.selectedDiv).firstChild 
                    myTable.deleteRow(field.row.rowIndex);           
            })
 
            // Manage virtual indicators
            if (jmarc.saved) {
                jmarc.saveButton.classList.remove("text-danger");
                jmarc.saveButton.title = "No Unsaved Changes";
            } else {
                jmarc.saveButton.classList.add("text-danger");
                jmarc.saveButton.title = "Save Record";
            }

            // undoredo snapshot
            //jmarc.addUndoredoEntry("DELETE FIELD") 

        },
        deleteRecord(jmarc) {
            if (jmarc.workformName) {
                if (confirm("Are you sure you want to delete Workform ?") == true) {
                    Jmarc.deleteWorkform(jmarc.collection, jmarc.workformName).then( () => {
                        this.removeRecordFromEditor(jmarc);
                        this.callChangeStyling(`Workform ${jmarc.collection}/workforms/${jmarc.workformName} has been deleted`, "row alert alert-success")
                        //this.removeFromBasket(jmarc.recordId, jmarc.collection)                 
                    })
                }
            } else {
                if (confirm("Are you sure you want to delete this record ?") == true) {
                    let deletedRid = jmarc.recordId;
                    let deletedColl = jmarc.collection;
 
                    this.$root.$refs.basketcomponent.removeRecordFromList(jmarc.collection, jmarc.recordId).then( () => {
                        jmarc.delete().then( () => {
                            this.removeRecordFromEditor(jmarc);
                            this.callChangeStyling(`Record ${deletedColl}/${deletedRid} has been deleted`, "row alert alert-success");
                        }).catch( error => {
                            this.callChangeStyling(error.message,"row alert alert-danger");
                        });
                    })
                }
            }
 
        },
        saveToWorkform(jmarc) {
            jmarc.workformName = "<new>";
            jmarc.workformDescription = " ";
            jmarc.newWorkForm = true;
            this.removeRecordFromEditor(jmarc); // div element is stored as a property of the jmarc object
            this.displayMarcRecord(jmarc, false);
            this.callChangeStyling("Name your new workform, then click the Save button", "row alert alert-warning")
            jmarc.saveButton.onclick = () => {
                jmarc.saveAsWorkform(jmarc.workformName, jmarc.workformDescription).then( () => {
                    this.removeRecordFromEditor(jmarc); // div element is stored as a property of the jmarc object
                    this.displayMarcRecord(jmarc, false);
                    this.callChangeStyling(`Workform ${jmarc.collection}/workforms/${jmarc.workformName} saved.`, "row alert alert-success")
                })
            }
        },
 
        async editRecord(jmarc) {
            let uibase = this.prefix.replace("/api/","");
            let editLink = `${uibase}/editor?records=${jmarc.collection}/${jmarc.recordId}`;
            basket.createItem(this.prefix, "userprofile/my_profile/basket", jmarc.collection, jmarc.recordId).then(res => {
                window.location.href = editLink;
            })
        },
 
        toggleHidden(jmarc) {
            for (let field of jmarc.fields) {
                if (field.row.classList.contains("hidden-field")) {
                    field.row.classList.remove("hidden-field")
                    field.wasHidden = true;
                }
                else if (field.wasHidden) {
                    field.row.classList.add("hidden-field")
                }
            }
        },
        selectRecord(jmarc) {
            this.clearSelectedRecord()
            //this.callChangeStyling("Record " + jmarc.recordId + " has been selected", "row alert alert-success")
            this.selectedRecord = jmarc.recordId
            this.selectedDiv=jmarc.div.id
            this.selectedJmarc=jmarc
            let idRow = document.querySelector(`div#${jmarc.div.id} thead tr`)
            idRow.style.backgroundColor = "#009edb"
            let checkBox = document.querySelector(`div#${jmarc.div.id} i#selectRecordButton`)
            checkBox.classList.replace("fa-square","fa-check-square")
        },
        async unlockRecord(jmarc, lockedBy) {
            let uibase = this.prefix.replace("/api/","")
            let editHref = `${uibase}/editor?records=${jmarc.collection}/${jmarc.recordId}`
            if(confirm(`This will remove the item from the basket belonging to ${lockedBy}. Click OK to proceed.`) == true) {
                basket.createItem(this.prefix, "userprofile/my_profile/basket", jmarc.collection, jmarc.recordId, true).then(res => {
                    window.location.href = editHref;
                })
            }
        },

        //////////////////////////////////////////////////////// 
        ///// definition of the listeners for the shortcuts
        ////////////////////////////////////////////////////////

        addHelpListener(event) {
            // check if one record is selected
            if (event.ctrlKey && event.key === "h"){
                event.preventDefault();
                alert("Shortcuts implemented: "+ "\n" +"-----------------------------------------------------------------"+
                 "\n" +"ctrl + F4 => Close the window of the record selected"+
                 "\n"+"ctrl + s => Save the record selected"+
                 "\n"+"ctrl + ENTER => Add a new field to the record selected"+
                 "\n"+"ctrl + k => remove the field from the record selected" +
                 "\n"+"ctrl + / => Add a new subField to the record selected"+
                 "\n"+"ctrl + m => remove the last subField selected from the record selected"+
                 "\n"+"ctrl + p => paste/duplicate previously selected/copied fields"+
                 "\n"+"ctrl + h => Display help menu" +
                 "\n"+"ctrl + q => Change the selected record"
                 );
            }    
        },
        changeSelectedRecordListener(event) {
            if (this.selectedRecord!=="")
                if (this.isRecordOneDisplayed==true && this.isRecordTwoDisplayed==true)
                    if (event.ctrlKey && event.key === "q"){
                        if (this.selectedJmarc.recordId===this.displayedJmarcObject[0].recordId){
                            this.selectRecord(this.displayedJmarcObject[1])
                            this.callChangeStyling("Crtl + q has been pressed in order to select a new record", "row alert alert-warning");
                        }
                        // 
                        else{
                            this.selectRecord(this.displayedJmarcObject[0])
                            this.callChangeStyling("Crtl + q has been pressed in order to select a new record", "row alert alert-warning");
                        }
                    }
        }, 
        pasteFieldListener(event) {
            if (this.selectedRecord!=="")
            {
                if (event.ctrlKey && event.key === "p"){
                    event.preventDefault();
                    //this.callChangeStyling("Crtl + p has been pressed in order to paste selected field(s)", "row alert alert-warning");
                    this.pasteField(this.selectedJmarc)
                }
            }
           
        },  
        addSubFieldListener(event) {
            if (this.selectedRecord!=="")
            {
                if (event.ctrlKey && event.key === "/"){
                    event.preventDefault();
                    //this.callChangeStyling("Crtl + / has been pressed in order to add a new subfield", "row alert alert-warning");
                    this.addSubField(this.selectedJmarc)
                }
            }
           
        },
        deleteSubFieldListener(event) {
            if (this.selectedRecord!=="")
            {
                if (event.ctrlKey && event.key === "m"){
                    event.preventDefault();
                    //this.callChangeStyling("Crtl + m has been pressed in order to remove a new subfield", "row alert alert-warning");
                    this.deleteSubFieldFromShort(this.selectedJmarc)
                }
            }
           
        },    
        addFieldListener(event) {
            if (this.selectedRecord!=="")
            {
                if (event.ctrlKey && event.key === "Enter"){
                    event.preventDefault();
                    //this.callChangeStyling("Crtl + Enter has been pressed in order to add a new field", "row alert alert-warning");
                    this.addField(this.selectedJmarc)
                }
            }
           
        },
        deleteFieldListener(event) {
            if (this.selectedRecord!=="")
            {
                if (event.ctrlKey && event.key === "k"){
                    event.preventDefault();
                    //this.callChangeStyling("Crtl + k has been pressed in order to delete the field selected", "row alert alert-warning");
                    this.deleteField(this.selectedJmarc)
                }
            }
           
        },
        saveRecordListener(event) {
            if (this.selectedRecord!=="")
            {
                if (event.ctrlKey && event.key === "s") {
                    event.preventDefault();
                    //this.callChangeStyling("Crtl + s has been pressed in order to remove the selected record from the stage", "row alert alert-warning");
                    this.saveRecord(this.selectedJmarc)
 
                }
            }
           
        },
        removeRecordListener(event) {
            if (this.selectedRecord!=="")
            {
                if (event.ctrlKey && event.code === "F4")   {
                    event.preventDefault();
                   
                    if (this.selectedDiv==="record1"){
                        let recup=document.getElementById("record1")
                        recup.innerHTML=""
                    }
                    if (this.selectedDiv==="record2") {
                        let recup=document.getElementById("record2")
                        recup.innerHTML=""
                    }                   
                    this.removeRecordFromEditor(this.selectedJmarc)
 
 
                }
            }
           
        },
 
        optimizeEditorDisplay(table){
 
            // // only record1 displayed
            if (this.isRecordOneDisplayed == true && this.isRecordTwoDisplayed == false){
               
                let myDiv=document.getElementById("records")
 
                // change the class
                myDiv.className="ml-3"
 
                // get the record1 div and change the style
                let myRecord1=document.getElementById("record1")
 
                // change the class
                myRecord1.className="col-sm-12 mt-1"
            }
 
            // // only record2 displayed
            if (this.isRecordOneDisplayed == false && this.isRecordTwoDisplayed == true){
                let myDiv=document.getElementById("records")
               
                // change the class
                myDiv.className="ml-3"
 
                // get the record1 div and change the style
                let myRecord2=document.getElementById("record2")
 
                // change the class
                myRecord2.className="col-sm-12 mt-1"
            }
 
            // restore the default values
            if (this.isRecordOneDisplayed == true && this.isRecordTwoDisplayed == true){
                let myDiv=document.getElementById("records")
               
                // change the class
                myDiv.className="row ml-3"
 
                // get the record1 div and change the style
                let myRecord1=document.getElementById("record1")
 
                // change the class
                myRecord1.className="col-sm-6 mt-1"
 
                // get the record2 div and change the style
                let myRecord2=document.getElementById("record2")
 
                // change the class
                myRecord2.className="col-sm-6 mt-1"   
            }
        },
        // definition of the different shortcuts
        keybShorcuts(e) {
            e = e || window.event;
            if (e.keyCode == '38' && ctrlKey) {
              // up arrow
              var idx = start.cellIndex;
              var nextrow = start.parentElement.previousElementSibling;
              if (nextrow != null) {
                var sibling = nextrow.cells[idx];
                dotheneedful(sibling);
              }
            }
          },
 
        clearItemsToPast(){
            this.listElemToCopy=[]
        },
 
        clearSelectedRecord(){
           
            // remove checked option
            let selectedRecords=document.querySelectorAll("i#selectRecordButton")
            let selectedRecordsArray=Array.from(selectedRecords)
            selectedRecordsArray.forEach(element => {
                element.classList.replace("fa-check-square", "fa-square")
            })
 
            // change color header
            let selectedHeader=document.getElementsByTagName("thead")
            let selectedHeadersArray=Array.from(selectedHeader)
            selectedHeadersArray.forEach(element => {
                element.firstChild.style.backgroundColor = "#F2F2F2";
            })
 
            // clean the variables
            //this.selectedRecord="" i think we can keep this one in order to keep the focus on the record
            this.selectedRecordsArray=[]
            this.selectedDiv=""
            this.selectedJmarc=""
            this.selectedFields=[]
           
        },
        // add a new Line to the table
        addLineToTable(index,table){
 
            // Insère une ligne dans la table à l'indice de ligne 0
            let newRow = table.insertRow(index);
 
            // Insère une cellule dans la ligne à l'indice 0
            let newCell1 = newRow.insertCell(index);
            let newCell2 = newRow.insertCell(index);
            let newCell3 = newRow.insertCell(index);
 
            // Ajoute un nœud texte à la cellule
            let newText = document.createTextNode('Nouvelle ligne supérieure')
            newCell1.innerHTML="1"
            newCell2.innerHTML="2"
            newCell3.innerHTML="3"
        },
        // remove a line from the table
        removeLineFromTable(){
            // Delete second row
            table.deleteRow(this.rowSelected);
        },
        getRecords() {
            let myVar=[]
            myVar.push(recup.record1)
            myVar.push(recup.record2)
           
            return myVar
        },
        canDisplay() {
            if (recup.collectionRecord1==="auths" && recup.collectionRecord2==="auths"){
                return true
            }
            else {
                return false
            }
        },
        callChangeStyling(myText, myStyle) {
            this.$root.$refs.messagecomponent.changeStyling(myText, myStyle)
        },
        getIdFromRecordId(recId, coll) {
            this.id = this.$root.$refs.basketcomponent.getId(recId, coll)
        },
        toggleBasketItem(recId, coll) {
            let myBasketId = this.$root.$refs.basketcomponent.getId(recId, coll);
            let myI = document.getElementById(`${coll}/${recId}`);
            if (myBasketId) {
                this.removeFromBasket(subfield.xref, "auths").then(
                    () => {myI.className = "fas fa-folder-minus float-left";}
                );
            }
            else {
                this.$root.$refs.basketcomponent.addRecordToList(recId, coll).then(
                    () => {myI.className = "fas fa-folder-minus float-left";}
                );
            }
        },
        async removeFromBasket(recId, coll) {
 
            basketcomponent.removeRecordFromList(recId, coll)
            basket.deleteItem(this.prefix, 'userprofile/my_profile/basket', this.myBasket, coll, recId).then( () => {
                return true;
            })
 
        },
        removeRecordFromEditor(jmarc,keepDataInVector=false) {

            // clear the entries for the undoredo vector
            if (keepDataInVector==false) { 
                jmarc.clearUndoredoVector()
            }    

            let divID = jmarc.div.id
 
            if (divID === "record1") {
                // reset the parameters
                this.removeJmarcTodisplayedJmarcObject(this.record1)
                this.$root.$refs.basketcomponent.removeRecordFromRecordDisplayed(this.record1)
                this.record1 = ""
                this.isRecordOneDisplayed = false
                this.collectionRecord1=""
                let recup=document.getElementById("record1")
                recup.innerHTML=""
                if (keepDataInVector==false) { 
                    this.callChangeStyling("Record removed from the editor", "row alert alert-success")
                }
               
            }
            else if (divID === "record2") {
                this.removeJmarcTodisplayedJmarcObject(this.record2)
                this.$root.$refs.basketcomponent.removeRecordFromRecordDisplayed(this.record2)
                this.record2 = ""
                this.isRecordTwoDisplayed = false
                this.collectionRecord2=""
                let recup=document.getElementById("record2")
                recup.innerHTML=""
                if (keepDataInVector==false) {
                this.callChangeStyling("Record removed from the editor", "row alert alert-success")
                }
            }
            // optimize the display
            this.selectedRecord=""
            this.optimizeEditorDisplay(this.targetedTable)
            this.targetedTable=""
 
            // check if we still have a record displayed
            if (this.displayedJmarcObject.length>0) {
                this.selectedRecord = this.displayedJmarcObject[0].recordId
                this.selectedDiv=this.displayedJmarcObject[0].recordId     
                this.selectRecord(this.displayedJmarcObject[0])
            }

            //console.log(this.recordlist.indexOf(`${jmarc.collection}/${jmarc.recordId}`));
            this.recordlist.splice(this.recordlist.indexOf(`${jmarc.collection}/${jmarc.recordId}`));
        },
        displayMarcRecord(jmarc, readOnly,reload=false) {
            let myDivId;
           
            if (this.isRecordOneDisplayed == false) {
                myDivId = "record1";
                this.isRecordOneDisplayed = true;
                this.record1 = jmarc.recordId;
                this.collectionRecord1 = jmarc.collection; // used for auth merge
            }
            else if (this.isRecordTwoDisplayed == false) {
                myDivId = "record2";
                this.isRecordTwoDisplayed = true
                this.record2 = jmarc.recordId;
                this.collectionRecord2 = jmarc.collection; // used for auth merge
            }
            else {
                // replace record?
            }

            if (reload==false){
                jmarc.addUndoredoEntry()
            }
           
            jmarc.div = document.getElementById(myDivId);
            let table = this.buildRecordTable(jmarc,readOnly);
 
            jmarc.div.appendChild(table); 
            this.selectRecord(jmarc) 
 
            // add the jmarc inside the list of jmarc objects displayed
            // only if the array size is under 2
 
            this.addJmarcTodisplayedJmarcObject(jmarc);

            let recordString = `${jmarc.collection}/${jmarc.recordId}`;

            if (! this.recordlist.includes(recordString)) {
                this.recordlist.push(recordString)
            }

            //////////////////////////////////////////////////////////////////////////////
            // optimize the display just when you have one record displayed
            //////////////////////////////////////////////////////////////////////////////
 
            this.targetedTable=table
            this.optimizeEditorDisplay(table)
        },
        buildRecordTable(jmarc, readOnly) {
            let component = this;
            let table = document.createElement("table");
            jmarc.table = table;

            table.addEventListener("click", function() {
                component.selectRecord(jmarc) 
            });
 
            window.addEventListener("click",  function() {
                let dropdown = document.getElementById("typeahead-dropdown")
                dropdown && dropdown.remove();
            });
           
            // record.css
            table.className = jmarc.collection === "bibs" ? "bib" : "auth";
            table.className += " marc-record table-hover table_editor";
         
            if (readOnly || jmarc.readOnly) {
                table.className += " read-only"
            }
           
            // Header: record ID, save, clone, paste
            let tableHeader = this.buildTableHeader(jmarc); 
           
            // Table body: record data
            let tableBody = this.buildTableBody(jmarc);
            
            // check the save status on any input
            table.addEventListener("input", function() {
                if (jmarc.saved) {
                    jmarc.saveButton.classList.remove("text-danger");
                    jmarc.saveButton.title = "No Unsaved Changes";
                } else {
                    jmarc.saveButton.classList.add("text-danger");
                    jmarc.saveButton.title = "Save Record";
                }
            });

            // check the save status on mousedown (auth conrrol select)
            table.addEventListener("mousedown", function() {
                if (jmarc.saved) {
                    jmarc.saveButton.classList.remove("text-danger");
                    jmarc.saveButton.title = "No Unsaved Changes";
                } else {
                    jmarc.saveButton.classList.add("text-danger");
                    jmarc.saveButton.title = "Save Record";
                }
            });
           
            return table      
        },
        buildTableHeader(jmarc) {
            let component = this; // apparently this one is not used
            let table = jmarc.table;
           
            // Table header
            let tableHeader = table.createTHead();
            jmarc.tableHEader = tableHeader;
            //let controlRow = tableHeader.insertRow();
           
 
            let idRow = tableHeader.insertRow();
            let idCell = idRow.insertCell();
            idCell.colSpan = 3;
           
            // This could be offloaded to config
            let controls = [
                {"name": "selectRecordButton", "element": "i", "class": "far fa-square", "title": "Select/Unselect Record", "click": "selectRecord"},
                {"name": "idField", "element": "h5", "class": "mx-2", "title": "", "load": "getId" },
                {"name": "saveButton", "element": "i", "class": "fas fa-save", "title": "No Unsaved Changes", "click": "saveRecord"},
                {"name": "saveAsButton", "element": "i", "class": "fas fa-share-square", "title": "Save As Workform" ,"click": "saveToWorkform" },
                {"name": "cloneButton", "element": "i", "class": "fas fa-copy", "title": "Clone Record", "click": "cloneRecord" },
                {"name": "pasteButton", "element": "i", "class": "far fa-arrow-alt-circle-down", "title": "Paste Fields", "click": "pasteField" },
                {"name": "toggleButton", "element": "i", "class": "fas fa-solid fa-eye", "title": "Toggle Hidden Fields", "click": "toggleHidden" },
                {"name": "deleteButton", "element": "i", "class": "fas fa-trash-alt", "title": "Delete Record",  "click": "deleteRecord" },
                {"name": "undoButton", "element": "i", "class": "fa fa-undo", "title": "Undo",  "click": "moveUndoredoIndexUndo","param":jmarc},
                {"name": "redoButton", "element": "i", "class": "fa fa-redo", "title": "Redo",  "click": "moveUndoredoIndexRedo","param":jmarc},
                {"name": "removeButton", "element": "i", "class": "fas fa-window-close float-right", "title": `Close Record`, "click": "removeRecordFromEditor"},
            ];
            if (jmarc.workformName) {
                controls = [
                    {"name": "selectRecordButton", "element": "i", "class": "far fa-square", "title": "Select/Unselect Workform", "click": "selectRecord"},
                    {"name": "idField", "element": "h5", "class": "mx-2", "title": "", "load": "getId" },
                    {"name": "saveButton", "element": "i", "class": "fas fa-save", "title": "Save Workform", "click": "saveRecord"},
                    {"name": "saveAsButton", "element": "i", "class": "fas fa-share-square", "title": "Save As Record", "click": "cloneRecord" },
                    {"name": "pasteButton", "element": "i", "class": "far fa-arrow-alt-circle-down", "title": "Paste Fields", "click": "pasteField" },
                    {"name": "toggleButton", "element": "i", "class": "fas fa-solid fa-eye", "title": "Toggle Hidden Fields", "click": "toggleHidden" },
                    {"name": "deleteButton", "element": "i", "class": "fas fa-trash-alt", "title": "Delete Workform", "click": "deleteRecord" },
                    {"name": "undoButton", "element": "i", "class": "fa fa-undo", "title": "Undo",  "click": "moveUndoIndexUndo","param":jmarc},
                    {"name": "redoButton", "element": "i", "class": "fa fa-redo", "title": "Redo",  "click": "moveRedoIndexRedo","param":jmarc},
                    {"name": "removeButton", "element": "i", "class": "fas fa-window-close float-right", "title": `close Workform`, "click": "removeRecordFromEditor"},
                ]
            }
            if (this.readonly && this.user !== null) {
                controls = [
                    {"name": "selectRecordButton", "element": "i", "class": "far fa-square", "title": "Select/Unselect Workform", "click": "selectRecord"},
                    {"name": "idField", "element": "h5", "class": "mx-2", "title": "", "load": "getId" },
                ]
                if (this.recordLocked["locked"] == true && this.recordLocked["by"] !== this.user) {
                    // It's locked by someone else
                    controls.push({"name": "editButton", "element": "i", "class": "fas fa-lock", "title": `Record locked by ${this.recordLocked["by"]}`, "click": "unlockRecord", "params": {"jmarc": jmarc, "lockedBy": this.recordLocked["by"]}})
                } else {
                    // It's either not locked, or locked by current user
                    controls.push({"name": "editButton", "element": "i", "class": "fas fa-edit", "title": "Edit Record", "click": "editRecord", "param": jmarc})
                }
            } else if (this.user == null) {
                controls = [
                    {"name": "selectRecordButton", "element": "i", "class": "far fa-square", "title": "Select/Unselect Workform", "click": "selectRecord"},
                    {"name": "idField", "element": "h5", "class": "mx-2", "title": "", "load": "getId" },
                ]
            }
            for (let control of controls) {
                let controlButton = document.createElement(control["element"]);
                idCell.appendChild(controlButton)
                controlButton.id = control["name"];
                if (control["element"] == "i") {
                    controlButton.type = "button";
                    controlButton.className = `${control["class"]} float-left p-1 record-control`;
                    controlButton.title = control["title"];
                    if (control["param"]) {
                        controlButton.onclick = () => {
                            this[control["click"]](control["param"]) 
                        }
                    } else if (control["params"]) {
                        controlButton.onclick = () => {
                            this[control["click"]](control["params"]["jmarc"], control["params"]["lockedBy"]) 
                        }
                    } else {
                        controlButton.onclick = () => {
                            this[control["click"]](jmarc) 
                        }
                    }
                    jmarc[control["name"]] = controlButton;
               } else {
                    if (jmarc.workformName) {
                        controlButton.innerText = `${jmarc.collection}/workforms/${jmarc.workformName}`;
                    } else {
                        let recordId = jmarc.recordId ? jmarc.recordId : "<New Record>"
                        controlButton.innerText = `${jmarc.collection}/${recordId}`;
                    }
                    controlButton.className = `${control["class"]} float-left`;
                }
                
            }
           
 
            // Files
            let filesRow = tableHeader.insertRow();
            let filesCell = filesRow.insertCell();
            filesCell.colSpan = 6;
            filesCell.className = "text-wrap"
            let filesUL = document.createElement("ul");
            filesUL.className = "list-group list-group-horizontal list-group-flush m-0 p-0";
            filesCell.appendChild(filesUL);
           
            function fileSort(a, b) {
                if (a.language === "en") return -1;
                if (b.language === "en") return 1;
                return a.language > b.language;
            }
           
            if (jmarc.files) {
                for (let f of jmarc.files.sort(fileSort)) {
                    let fileLI = document.createElement("li");
                    fileLI.className = "list-group-item border-0 m-0 p-0 mr-1 float-left";
                   
                    let itemUL = document.createElement("ul");
                    itemUL.className = "list-group list-group-horizontal list-group-flush m-0 p-0";               
                    
                    let fileLabel = document.createElement("span");
                    fileLabel.innerText = `${f['language']}`;
                    //itemLI.appendChild(fileLabel);
                   
                    let fileOpen = document.createElement("a");
                    fileOpen.href = `${f['url']}?action=open`;
                    fileOpen.target = "_blank";
                    fileOpen.title = "Open";
                    let openIcon = document.createElement("i");
                    openIcon.className = "fas fa-file text-dark";
                    fileOpen.appendChild(openIcon);
                   
                    let fileDownload = document.createElement("a");
                    fileDownload.href = `${f['url']}?action=download`;
                    fileDownload.title = "Download";
                    let downloadIcon = document.createElement("i");
                    downloadIcon.className = "fas fa-cloud-download-alt text-dark";
                    fileDownload.appendChild(downloadIcon);
                    
                    let labelLI = document.createElement("li");
                    labelLI.className = "list-group-item list-group-item-dark border-0 m-0 p-0 px-1";
                    let openLI = document.createElement("li");
                    openLI.className = "list-group-item list-group-item-action list-group-item-dark border-0 m-0 p-0 px-1";
                    let downloadLI = document.createElement("li");
                    downloadLI.className = "list-group-item list-group-item-action list-group-item-dark border-0 m-0 p-0 px-1";
                    labelLI.appendChild(fileLabel);
                    openLI.appendChild(fileOpen);
                    downloadLI.appendChild(fileDownload);
                   
                    itemUL.appendChild(labelLI);
                    itemUL.appendChild(openLI);
                    itemUL.appendChild(downloadLI);
                   
                    fileLI.appendChild(itemUL);
                    filesUL.appendChild(fileLI);
                   
                }
            }
           
            // Workform fields 
            if (jmarc.workformName) {
                let wfNameRow = tableHeader.insertRow();
                let wfNameLabelCell = wfNameRow.insertCell();
                wfNameLabelCell.colSpan = 2;
                wfNameLabelCell.innerText = "Workform Name";
                let wfNameCell = wfNameRow.insertCell();
                wfNameCell.colSpan = 3;
                wfNameCell.innerText = jmarc.workformName;
                wfNameCell.contentEditable = true;
                wfNameCell.addEventListener("input", function() {
                    let originalName = jmarc.workformName;
                    jmarc.workformName = wfNameCell.innerText;
                    if (jmarc.workformName != originalName) {
                        jmarc.newWorkForm = true;
                    }
                });
            }
 
            if (jmarc.workformDescription) {
                let wfDescRow = tableHeader.insertRow();
                let wfDescLabelCell = wfDescRow.insertCell();
                wfDescLabelCell.colSpan = 2;
                wfDescLabelCell.innerText = "Workform Description";
                let wfDescCell = wfDescRow.insertCell();
                wfDescCell.colSpan = 3;
                wfDescCell.innerText = jmarc.workformDescription;
                wfDescCell.contentEditable = true;
                wfDescCell.addEventListener("input", function() {
                    jmarc.workformDescription = wfDescCell.innerText;
                });
            }
 
            return tableHeader
        },
        buildRecordControls(jmarc) {
 
        },
        buildTableBody(jmarc) {
            let tableBody = jmarc.table.createTBody();
            jmarc.tableBody = tableBody;
 
            // Fields
            for (let field of jmarc.fields.sort((a, b) => parseInt(a.tag) - parseInt(b.tag))) {
                this.buildFieldRow(field);
            }
           
            return tableBody
        },
        buildFieldRow(field, place) {

            let component = this;
            let jmarc = field.parentRecord;


            let table = jmarc.table;

            let tableBody = jmarc.tableBody; 
            
            field.row = tableBody.insertRow(place);
   
            // add the checkboxes
            let checkCell = field.row.insertCell();
            checkCell.className = "field-checkbox";
            let inputCheckboxCell = document.createElement("input");
            inputCheckboxCell.className = "field-checkbox";
            inputCheckboxCell.setAttribute("type","checkbox")
            checkCell.appendChild(inputCheckboxCell)
   
            // the instance of the calling object
            // let that = component;
 
            // define the on click event
            checkCell.addEventListener('click', (e)=> {
                // check if the box is checked
                if (e.target.checked === true){
                    // add the selected field(s) inside the selectedFields array
                    // only if the jmarc is the selected one
                    if (jmarc.recordId==component.selectedJmarc.recordId)
                        {
                            component.selectedFields.push(field);
                        } 
                    component.copiedFields.push(field);
                } else {
                   if (component.copiedFields) {
                       // remove from the list of copied fields
                       component.copiedFields.splice(component.copiedFields.indexOf(field, 1))
                       if (jmarc.recordId==component.selectedJmarc.recordId)
                       {
                        component.selectedFields.splice(component.selectedFields.indexOf(field, 1))
                       }
                      
                   }
                }
            });

            // Tag cell
            let tagCell = field.row.insertCell();
            field.tagCell = tagCell;
            tagCell.className = "field-tag badge badge-warning dropdown-toggle";
   
            // menu
            let tagMenu = document.createElement("div");
            tagCell.append(tagMenu);
            tagMenu.className = "dropdown-menu tag-menu";
 
            // enable elems to toggle menu
            tagCell.setAttribute("data-toggle", "dropdown");
 
            // menu item add field
            let addField = document.createElement("i");
            tagMenu.append(addField);
            addField.className = "dropdown-item";
            addField.innerText = "Add field";
   
            addField.addEventListener("click", function() {
                let newField = jmarc.createField("___", (field.row.rowIndex - 2 /*2 header rows*/) + 1);
                newField.indicators = ["_", "_"];
       
                let newSubfield = newField.createSubfield();
                newSubfield.code = "_";
                newSubfield.value = "";
       
                newField = component.buildFieldRow(newField, field.row.rowIndex - 1);
                newField.tagSpan.focus();
                document.execCommand("selectall");
                newField.subfields[0].valueCell.classList.add("unsaved");
 
                // Manage visual indicators
                jmarc.saveButton.classList.add("text-danger");
                jmarc.saveButton.title = "Save Record";
 
                return
            });
   
            // menu item delete field
            let deleteField = document.createElement("i");
            tagMenu.append(deleteField);
            deleteField.className = "dropdown-item";
            deleteField.innerText = "Delete field";
   
            deleteField.addEventListener("click", function() {
                if (jmarc.fields.length === 1) {
                    // this is the record's only field
                    component.callChangeStyling("Can't delete record's only field", "row alert alert-danger")
                   
                    return
                }
               
                jmarc.deleteField(field);
                table.deleteRow(field.row.rowIndex);
 
                if (jmarc.saved) {
                    jmarc.saveButton.classList.remove("text-danger");
                    jmarc.saveButton.title = "No Unsaved Changes";
                } else {
                    jmarc.saveButton.classList.add("text-danger");
                    jmarc.saveButton.title = "Save Record";
                }

                // adding the snapshot 
                jmarc.addUndoredoEntry("from Delete Field")
            });
   
            // Tag span
            let tagSpan = document.createElement("span");
            tagCell.append(tagSpan);
            field.tagSpan = tagSpan;
            tagSpan.contentEditable = true;
            tagSpan.innerText = field.tag;
   
            // for storing the state of the control/command keypress
            let metaKey = false;
   
            tagSpan.addEventListener("input", function () {
                tagSpan.classList.remove("invalid");
                field.tagSpan.classList.remove("unsaved");
       
                field.tag = tagSpan.innerText;
       
                let savedState = new Jmarc(jmarc.collection);
                savedState.parse(jmarc.savedState);
 
                for (let subfield of field.subfields) {
                    subfield.codeCell.classList.remove("unsaved");
                    subfield.valueCell.classList.remove("unsaved");
           
                    if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
                        component.setAuthControl(field, subfield, subfield.valueCell, subfield.valueSpan)
                    } else {
                        component.removeAuthControl(subfield);
                    }
           
                    let i = field.subfields.indexOf(subfield);
                    let j = jmarc.fields.indexOf(field);
                    let checkField = savedState.fields[j] ? savedState.fields[j] : null;
                    let checkSubfield = checkField ? checkField.subfields[i] : null;
 
                    if (! checkField || field.tag !== checkField.tag) {
                        field.tagSpan.classList.add("unsaved");
                    }
           
                    if (! checkSubfield || checkSubfield.code !== subfield.code) {
                        subfield.codeCell.classList.add("unsaved");
                    }
           
                    if (checkSubfield && checkSubfield.value !== subfield.value) {
                        subfield.valueCell.classList.add("unsaved");
                    }
                }

                console.log(JSON.stringify(jmarc.savedState))
            });
   
            tagSpan.addEventListener("keydown", function (event) {
                // prevent newline and blur on return key
                if (event.keyCode === 13) {
                    event.preventDefault();
                    tagSpan.blur();
                }
       
                // store control/command key press
                if (event.keyCode === 17 || event.keyCode === 91 || event.keyCode === 224) {
                    metaKey = true
                }
       
                // prevent typing more than 3 characters
                if (metaKey === false && tagSpan.innerText.length === 3 && event.keyCode > 45 && event.keyCode < 224) {
                    // field value resets
                    tagSpan.innerText = ''
                }
            });
   
            tagSpan.addEventListener("keyup", function (event) {
                // clear control/command key press
                if (event.keyCode === 17 || event.keyCode === 91 || event.keyCode === 224) {
                    metaKey = false
                }
            });
   
            tagSpan.addEventListener("blur", function() {
                while (tagSpan.innerText.length < 3) {
                    tagSpan.innerText += '_';
                }
 
                if (! tagSpan.innerText.match(/^\d{3}/)) {
                    field.tagSpan.classList.remove("unsaved");
                    field.tagSpan.classList.add("invalid");
                } 
                
            });
 
            tagSpan.addEventListener("mouseover", function() {
                tagSpan.focus()
            });
   
            tagSpan.addEventListener("click", function() {
                tagSpan.focus();
                document.execCommand("selectall", null, false);
            });
 
            // keep menu on click
            tagSpan.addEventListener("click", function() {
                $(tagMenu).dropdown("hide");
            });
   
            // hide menu when typing
            tagSpan.addEventListener("keydown", function() {
                $(tagMenu).dropdown("hide");
            });

            tagSpan.addEventListener("input",function(){
                // adding the snapshot 
                if (tagSpan.innerText.length === 3) {
                    jmarc.addUndoredoEntry("from Tag")
                }
            });
   
            // Indicators
            if (! field.tag.match(/^00/)) {
                let ind1Span = document.createElement("span");
                tagCell.append(ind1Span);
       
                let ind2Span = document.createElement("span");
                tagCell.append(ind2Span);

                for (let span of [ind1Span, ind2Span]) {
                    let indicator = span === ind1Span ? field.indicators[0] : field.indicators[1];
                    span.className = "mx-1"
                    span.innerText = indicator;
                    span.contentEditable = true;
       
                    span.addEventListener("input", function() {
                        if (span.innerText.length > 1) {   
                            span.innerText = span.innerText.substring(0, 1);
                        }

                        if (span.innerText.length === 0) {   
                            span.innerText = '_';
                        }
                        
                        // update the indicators 
                        let updated = [field.indicators[0], field.indicators[1]]

                        if (span == ind1Span) {
                            updated[0] = span.innerText;
                        } else if (span == ind2Span) {
                            updated[1] = span.innerText;
                        }

                        field.indicators = updated;

                        // detect state
                        let savedState = new Jmarc(jmarc.collection);
                        savedState.parse(jmarc.savedState);
                        let i = jmarc.fields.indexOf(field);

                        console.log(savedState.fields[i].indicators)
                        console.log(field.indicators)

                        let j = span === ind1Span ? 0 : 1;

                        if (savedState.fields[i].indicators[j] === field.indicators[j]) {
                            span.classList.remove("unsaved")
                        } else {
                            span.classList.add("unsaved")
                        }

                        if (jmarc.saved) {
                            jmarc.saveButton.classList.remove("text-danger");
                            jmarc.saveButton.title = "No Unsaved Changes";
                        } else {
                            jmarc.saveButton.classList.add("text-danger");
                            jmarc.saveButton.title = "Save Record";
                        }

                    });
       
                    span.addEventListener("keydown", function (event) {
                        // prevent newline and blur on return key
                        if (event.keyCode === 13) {
                            event.preventDefault();
                            span.blur();
                        }
                    });
           
                    span.addEventListener("blur", function() {
                        while (span.innerText.length < 1) {
                            span.innerText += '_';
                        }
                    });
           
                    // keep menu on click
                    span.addEventListener("click", function() {
                        $(tagMenu).dropdown("hide");
                    });
   
                    // hide menu when typing
                    span.addEventListener("keydown", function() {
                        $(tagMenu).dropdown("hide")
                    });
                }
            }
   
            // Field table
            let fieldCell = field.row.insertCell();
            let fieldTable = document.createElement("table");
            field.table = fieldTable;
            fieldCell.append(fieldTable);
            fieldTable.className = "marc-field";
   
            // Controlfield
            if (field.constructor.name == "ControlField") {
                field.row.classList.add("hidden-field");
       
                let fieldRow = fieldTable.insertRow();
                fieldRow.insertCell().className = "subfield-code"; // placeholder for subfield code column
                let valCell = fieldRow.insertCell();
                valCell.innerHTML = field.value;
       
                return
            }
 
           
            // Datafield
            for (let subfield of field.subfields) {
                this.buildSubfieldRow(subfield);  
            }
   
            return field
        },
        buildSubfieldRow(subfield, place) {
            let component = this;
            let field = subfield.parentField;
            let table = field.table;
            let jmarc = field.parentRecord;
   
            // create the row
            subfield.row = table.insertRow(place);
 
            // Subfield code
            let codeCell = subfield.row.insertCell();
            subfield.codeCell = codeCell;
            codeCell.className = "subfield-code badge bg-primary dropdown-toggle";
   
            // menu
            let codeMenu = document.createElement("div");
            codeCell.append(codeMenu);
            codeMenu.className = "dropdown-menu subfield-menu";
   
            // enable elems to toggle menu
            codeCell.setAttribute("data-toggle", "dropdown");
   
            let codeSpan = document.createElement("span");
            subfield.codeSpan = codeSpan;
            codeCell.append(codeSpan);
            codeSpan.contentEditable = true;
            codeSpan.innerText = subfield.code;
   
            // keep menu on click
            codeSpan.addEventListener("click", function() {
                $(codeMenu).dropdown("hide");
            });
   
            // hide menu when typing
            codeSpan.addEventListener("keydown", function() {
                $(codeMenu).dropdown("hide")
            });
 
            codeSpan.addEventListener("input", function() {
                subfield.codeSpan.classList.remove("invalid");
                subfield.codeSpan.classList.remove("unsaved");
                subfield.valueCell.classList.remove("unsaved");
       
                if (codeSpan.innerText.length > 1) {
                    // don't allow more than 1 char
                    codeSpan.innerText = codeSpan.innerText.substring(0, 1)
                }
       
                subfield.code = codeSpan.innerText;
       
                let savedState = new Jmarc(jmarc.collection);
                savedState.parse(jmarc.savedState);
                let i = field.subfields.indexOf(subfield);
                let j = jmarc.fields.indexOf(field);
                let checkField = savedState.fields[j] ? savedState.fields[j] : null;
                let checkSubfield = checkField ? checkField.subfields[i] : null;
 
                if (! checkSubfield || checkSubfield.code !== subfield.code) {
                    subfield.codeSpan.classList.add("unsaved");
                }
       
                if (checkSubfield && checkSubfield.value !== subfield.value) {
                    subfield.valueCell.classList.add("unsaved");
                }

                // adding the snapshot 
                if (codeSpan.innerText.length === 1) {
                    jmarc.addUndoredoEntry("from Code Subfield")
                }
            });
   
            codeSpan.addEventListener("keydown", function (event) {
                // prevent newline and blur on return key
                if (event.keyCode === 13) {
                    event.preventDefault();
                    codeSpan.blur();
                }
            });
   
            codeSpan.addEventListener("blur", function() {
                while (codeSpan.innerText.length < 1) {
                    codeSpan.innerText += '_';
                }
       
                // move to css
                if (codeSpan.innerText === '_') {
                    codeSpan.classList.remove("unsaved");
                    codeSpan.classList.add("invalid");
                }
            });
   
            // add subfield
            let addSubfield = document.createElement("i");
            codeMenu.append(addSubfield);
            addSubfield.className = "dropdown-item";
            addSubfield.innerText = "Add subfield";
   
            addSubfield.addEventListener("click", function() {
                let place = field.subfields.indexOf(subfield) + 1;
                let newSubfield = field.createSubfield("_", place);
                newSubfield.value = "";
                newSubfield = component.buildSubfieldRow(newSubfield, place);
       
                newSubfield.codeSpan.focus();
                document.execCommand("selectall");
       
                newSubfield.valueCell.classList.add("unsaved");
                saveButton.classList.add("text-danger");
                saveButton.classList.remove("text-primary");
                saveButton.title = "unsaved changes";

                return
            });
   
            // delete subfield
            let deleteSubfield = document.createElement("i");
            codeMenu.append(deleteSubfield);
            deleteSubfield.className = "dropdown-item";
            deleteSubfield.innerText = "Delete subfield";
 
            deleteSubfield.addEventListener("click", function() {
                if (field.subfields.length == 1) {
                    component.callChangeStyling("Can't delete the field's only subfield", "row alert alert-danger");
                    return
                }
       
                // Remove the subfield from the field
                field.deleteSubfield(subfield);
                // Remove the subfield row from the table
                table.deleteRow(subfield.row.rowIndex);
 
                // Manage visual indicators
                if (jmarc.saved) {
                    jmarc.saveButton.classList.remove("text-danger");
                    jmarc.saveButton.title = "No Unsaved Changes";
                } else {
                    jmarc.saveButton.classList.add("text-danger");
                    jmarc.saveButton.title = "Save Record";
                }

                // adding the snapshot 
                jmarc.addUndoredoEntry("from Delete SubField")
 
            });
   
            // Subfield value
            let valCell = subfield.row.insertCell();
            valCell.className = "subfield-value";
            valCell.setAttribute("data-taggle", "tooltip");
            //valCell.title = `Guidelines for ${field.tag}\$${subfield.code} (pending)`;
   
            let valSpan = document.createElement("span");
            valCell.appendChild(valSpan);
            subfield.valueCell = valCell;
            subfield.valueElement = subfield.valueSpan = valSpan; // save the value HTML element in the subfield object
            valSpan.innerText = subfield.value;
            valSpan.contentEditable = true;
 
            valCell.addEventListener("click", function () {valSpan.focus()});
            
            function checkState() {
                subfield.value = valSpan.innerText;
       
                let savedState = new Jmarc(jmarc.collection);
                savedState.parse(jmarc.savedState);
                let i = field.subfields.indexOf(subfield);
                let j = jmarc.fields.indexOf(field);
                let checkField = savedState.fields[j];
                let checkSubfield = checkField ? checkField.subfields[i] : null;
       
                if (! checkSubfield || subfield.value !== checkSubfield.value) {
                    valCell.classList.add("unsaved");
                }
                else {
                    valCell.classList.remove("unsaved");
                }

                // adding the snapshot 
                if (valCell.innerText.length > 0) {
                    jmarc.addUndoredoEntry("from Subfield Value")
                }
            }

            valCell.addEventListener("input", checkState);
            valCell.addEventListener("mousedown", checkState); // auth control selection
   
            valSpan.addEventListener("keydown", function (event) {
                // prevent newline and blur on return key
                if (event.keyCode === 13) {
                    event.preventDefault();
                    valSpan.blur();
                }
            });

            valSpan.addEventListener("input", function () {
                // select the record receiving the click
                component.selectRecord(jmarc)
                let myCheckBox=field.row.firstChild.firstChild
                // check the box of the record receiving the click
                // check if the box is checked
                if (myCheckBox.checked === true){
                    // add the selected field(s) inside the selectedFields array
                    // only if the jmarc is the selected one
                    if (jmarc.recordId==component.selectedJmarc.recordId)
                        {
                            component.selectedFields.push(field);
                        } 
                    component.copiedFields.push(field);
                } else {
                    myCheckBox.checked = true
                    if (component.copiedFields) {
                        // remove from the list of copied fields
                        component.copiedFields.splice(component.copiedFields.indexOf(field, 1))
                        if (jmarc.recordId==component.selectedJmarc.recordId)
                        {
                        component.selectedFields.splice(component.selectedFields.indexOf(field, 1))
                        }
                        
                    }
                }
            });

            const observer = new MutationObserver(function() {
                console.log('callback that runs when observer is triggered');
            });

            observer.observe(valSpan, {subtree: true, childList: true});
   
            codeSpan.addEventListener("input", function() {
                if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
                    component.setAuthControl(field, subfield)
                } else {
                    component.removeAuthControl(subfield)
                }
                // undoredo snapshot
                // jmarc.addUndoredoEntry("EDIT SUBFIELD CODE") 
            });
   
            // create the last cell
            subfield.xrefCell = subfield.row.insertCell()
   
            // auth controlled
            if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
                this.setAuthControl(field, subfield)
            }
   
            return subfield
        },
        setAuthControl(field, subfield) {
            let component = this;
            subfield.valueSpan.classList.add("authority-controlled");
   
            if (subfield.valueCell.classList.contains("unsaved")) {
                subfield.valueSpan.classList.add("authority-controlled-unmatched")
            }
 
            if (subfield.xrefCell.children.length === 0) {
                let xrefLink = document.createElement("a");
                subfield.xrefCell.appendChild(xrefLink);
                xrefLink.href = component.baseUrl + `records/auths/${subfield.xref}`;
                xrefLink.target="_blank";
     
                let xrefIcon = document.createElement("i");
                xrefIcon.className = "fas fa-link float-left mr-2";
                xrefLink.appendChild(xrefIcon);
            }
     
            // lookup
            subfield.valueCell.eventParams = [component, subfield];
            subfield.valueCell.addEventListener("keyup", keyupAuthLookup);
        },
        removeAuthControl(subfield) {
            if (subfield.xrefCell) {
                delete subfield.xref;
                subfield.xrefCell.innerHTML = "";
            }
   
            subfield.valueSpan.classList.remove("authority-controlled");
            subfield.valueSpan.classList.remove("authority-controlled-unmatched");
            subfield.valueCell.removeEventListener("keyup", keyupAuthLookup);
        }
    }
}
 
// auth-controlled field keyup event function
function keyupAuthLookup(event) {
    //target: subfield value cell
    let component = event.currentTarget.eventParams[0];
    let subfield = event.currentTarget.eventParams[1];
    let field = subfield.parentField;
   
    if (event.keyCode < 45 && event.keyCode !== 8) {
        // non ascii or delete keys
        return
    }
 
    subfield.valueSpan.classList.add("authority-controlled-unmatched");
    subfield.xrefCell.innerHTML = null;
 
    let dropdown = document.getElementById("typeahead-dropdown");
    dropdown && dropdown.remove();
 
    clearTimeout(subfield.timer);
    subfield.value = subfield.valueCell.innerText;
    delete subfield.xref;
 
    if (subfield.value) {
        subfield.timer = setTimeout(
            function () {
                let dropdown = document.createElement("div");
                subfield.valueCell.appendChild(dropdown);
                dropdown.className = "typeahead-dropdown";
                dropdown.id = "typeahead-dropdown";
                dropdown.innerHTML = "searching...";
               
                field.lookup().then(choices => {
                    if (choices.length == 0) {
                        dropdown.innerHTML = "not found";
                        setTimeout(function () { dropdown.remove() }, 1000)
                        return
                    }
                   
                    dropdown.innerHTML = null;
               
                    let list = document.createElement("ul");
                    dropdown.appendChild(list);
                    list.className = "list-group";
               
                    for (let choice of choices) {
                        let item = document.createElement("li");
                        list.appendChild(item);
                        item.className = "list-group-item lookup-choice";
                       
                        item.innerHTML = choice.subfields.map(x => `<span class="lookup-choice-code">$${x.code}</span>&nbsp;<span class="lookup-choice-value">${x.value}</span>`).join("<br>");
                       
                        item.addEventListener("mouseover", function () {
                            item.classList.add("lookup-choice");
                        });
                       
                        item.addEventListener("mouseout", function () {
                            item.classList.remove("lookup-choice");
                            subfield.value = subfield.valueSpan.innerText;
                        });
                       
                        item.addEventListener("mousedown", function () {
                            dropdown.remove();
 
                            for (let s of field.subfields) {
                                s.valueSpan.classList.remove("authority-controlled-unmatched");
                            }
               
                            for (let choiceSubfield of choice.subfields) {
                                let currentSubfield = field.getSubfield(choiceSubfield.code);
                               
                                if (typeof currentSubfield === "undefined") {
                                    let place = choice.subfields.indexOf(choiceSubfield);
                                    let newSubfield = field.createSubfield(choiceSubfield.code, place);
                                    newSubfield.value = choiceSubfield.value;
                                    currentSubfield = newSubfield;
                                    buildSubfieldRow(component, newSubfield, place);
                                }
               
                                currentSubfield.value = choiceSubfield.value;
                                currentSubfield.xref = choiceSubfield.xref;
                                currentSubfield.valueSpan.innerText = currentSubfield.value;
                                currentSubfield.valueSpan.classList.remove("authority-controlled-unmatched");
                                   
                                let xrefLink = document.createElement("a");
                                xrefLink.href = component.baseUrl + `records/auths/${choiceSubfield.xref}`;
                                xrefLink.target="_blank";
                                    
                                let xrefIcon = document.createElement("i");
                                xrefIcon.className = "fas fa-link float-left mr-2";
                                xrefLink.appendChild(xrefIcon);
                                    
                                while (currentSubfield.xrefCell.firstChild) {
                                    currentSubfield.xrefCell.removeChild(currentSubfield.xrefCell.firstChild)
                                }
                                    
                                currentSubfield.xrefCell.append(xrefLink);
                            }
                        });
                    }
                });
            },
            750
        );
    }
}
