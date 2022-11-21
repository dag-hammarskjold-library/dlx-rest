let recup=""
/////////////////////////////////////////////////////////////////
// IMPORT
/////////////////////////////////////////////////////////////////
 
import { 
    Jmarc,
    TagValidationFlag,
    Indicator1ValidationFlag,
    Indicator2ValidationFlag,
    SubfieldCodeValidationFlag,
    SubfieldValueValidationFlag
} from "./jmarc.mjs";
import user from "./api/user.js";
import basket from "./api/basket.js";
import { basketcomponent } from "./basket.js";
import { countcomponent } from "./search/count.js";
import { validationData } from "./validation.js";
 
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
        <div class="col-sm-10" id="app1" style="background-color:white;">
            <div>
                <div v-show="this.isRecordOneDisplayed==false && this.isRecordTwoDisplayed==false" mt-5>
                    <div class="jumbotron jumbotron-fluid">
                        <div class="container">
                            <p v-if="recordlist.length > 0" class="fa fa-5x fa-spinner fa-pulse"></p>
                            <p v-else class="text-center">No record selected</p>
                        </div>
                    </div>                               
                </div>
                <div id="records" class="row">
                    <div id="record1" v-show="this.isRecordOneDisplayed" class="col-sm-6 mt-1 pb-2 div_editor" style="overflow-y: scroll; min-height:650px; position: relative">
                        <!-- <div>
                            <button v-if="readonly" id="remove1" type="button" class="btn btn-outline-success mb-2" style="display:none">Remove this record</button>
                            <button v-else id="remove1" type="button" class="btn btn-outline-success mb-2">Remove this record</button>
                        </div> -->
                    </div>
                    <div id="record2" v-show="this.isRecordTwoDisplayed" class="col-sm-6 mt-1 pb-2 div_editor" style="overflow-y: scroll; min-height:650px;">
                        <!-- <div>
                            <button v-if="readonly" id="remove2" type="button" class="btn btn-outline-success mb-2" style="display:none">Remove this record</button>
                            <button v-else id="remove2" type="button" class="btn btn-outline-success mb-2" >Remove this record</button>
                        </div> -->
                    </div>
                    <br>&nbsp;
                </div>
            </div>
       
        <!-- Modal displaying history records -->
        <div id="modal" v-show="this.showModal">
            <transition name="modal">
                <div class="modal-mask">
                <div class="modal-wrapper" >
                    <div class="modal-container" id="modalchild">

                    <div class="modal-header" id="title">
                    
                        <slot name="header">
                            <h5><span id="titlemodal" class="mt-2"> Choose record view  </span></h5>
                            <button type="button" data-dismiss="modal" class="btn btn-primary" 
                                    @click="closeModal()"> Close the window
                            </button>
                        </slot>
                        
                    </div>
  
                    <div id="contenthistory" class="modal-body mt-0" >
                    </div>
                    <!-- <div class="modal-footer">
                        <slot name="footer">
                        <button type="button" data-dismiss="modal" class="btn btn-primary" 
                            @click="closeModal()"> Close the window
                        </button>
                        </slot>
                    </div> -->
                    </div>
                </div>
                </div>
            </transition>
        </div>

        <!-- Modal displaying save options -->
        <div id="modalSave" v-show="this.showModalSave">
            <transition name="modalSave">
                <div class="modal-mask">
                <div class="modal-wrapper" >
                    <div class="modal-container" id="modalchildsave">

                    <div class="modal-header" id="titleSave">
                    
                        <slot name="header">
                            <h3><span id="titlemodalSave" class="mt-2 text-danger"> Warning !!!  </span></h3>
                        </slot>
                        
                    </div>
  
                    <div id="contentSave" class="modal-body modal-content mt-0" >
                            <h5> You have unsaved changes </h5>
                    </div>
                    <div class="modal-footer">
                        <slot name="footer">
                        <button type="button" data-dismiss="modal" class="btn btn-primary" 
                            @click="closeModalSave();saveRecord(selectedJmarc,false);removeRecordFromEditor(selectedJmarc)"> Save
                        </button>
                        <button type="button" data-dismiss="modal" class="btn btn-primary" 
                            @click="closeModalSave();saveRecord(selectedJmarc,false);removeRecordFromEditor(selectedJmarc);$root.$refs.basketcomponent.removeRecordFromList(selectedJmarc.collection, selectedJmarc.recordId)"> Save and release
                        </button>
                        <button type="button" data-dismiss="modal" class="btn btn-primary" 
                            @click="closeModalSave();removeRecordFromEditor(selectedJmarc);"> Close and discard
                        </button>
                        <button type="button" data-dismiss="modal" class="btn btn-primary" 
                            @click="closeModalSave()"> Cancel
                        </button>
                        </slot>
                    </div>
                    </div>
                </div>
                </div>
            </transition>
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
            myDefaultViews: [],
            targetedTable:"",
            selectedRecord:"",
            selectedDiv:"",
            selectedJmarc:"",
            selectedFields:[],
            recordLocked: {"locked": false},
            showModal:false,
            showModalSave:false,
            numberRecordHistory:0,
            historyMode:false,
            historyJmarcOriginal:"",
            historyJmarcHistory:"",
            shiftPressed: false,
            controlPressed: false,
            commandPressed: false,
            isFiltered:false,
            currentRecordObjects: []
        }
    },

    created: 
    async function() {
    
    //////////////////////////////////////////////////////////////////////////
    // Management of the keyboard shortcuts
    //////////////////////////////////////////////////////////////////////////
    
    window.addEventListener("keydown", this.removeRecordListener)          // ESC => close the record selected
    window.addEventListener("keydown", this.saveRecordListener)            // ctrl + s => save the record selected
    window.addEventListener("keydown", this.addFieldListener)              // ctrl + ENTER => add a new field to the record selected
    window.addEventListener("keydown", this.addHelpListener)               // ctrl + h => show the help window about the shortcuts
    window.addEventListener("keydown", this.deleteFieldListener)           // ctrl + k => remove a field from the record selected
    window.addEventListener("keydown", this.addSubFieldListener)           // ctrl + / => add a subfield to the selected record
    window.addEventListener("keydown", this.deleteSubFieldListener)        // ctrl + m => remove a subfield from the selected record
    window.addEventListener("keydown", this.pasteFieldListener)            // ctrl + p => past the selected field
    window.addEventListener("keydown", this.changeSelectedRecordListener)  // ctrl + q => change the selected record
    window.addEventListener("keydown", this.refreshPageListener)           // ctrl + r => refresh the page
    

        let component = this;
        Jmarc.apiUrl = this.prefix;
        this.baseUrl = this.prefix.replace("/api", "");
       
        this.copiedFields = [];
        this.$root.$refs.multiplemarcrecordcomponent = this;

        let myProfile = await user.getProfile(this.prefix, 'my_profile');
        
        if (myProfile != null) {
            this.user = myProfile.data.email;
            this.myDefaultViews = myProfile.data.default_views;
            let myBasket = await basket.getBasket(this.prefix);
            
            if (this.records !== "None") {
                // "<col>/<id>"
                this.recordlist = this.records.split(",");
                
                for (let record of this.recordlist) {
                    let collection = record.split("/")[0];
                    let recordId = record.split("/")[1];
                    
                    let jmarc = await Jmarc.get(collection, recordId);

                    if (! jmarc) continue
                    
                    if (this.readonly && this.user !== null) {
                        //this.recordLocked = await basket.itemLocked(this.prefix, jmarc.collection, jmarc.recordId);
                        basket.itemLocked(this.prefix, jmarc.collection, jmarc.recordId).then( () => {
                            this.displayMarcRecord(jmarc, true)
                        })

                    } else if (this.user === null) {
                        this.displayMarcRecord(jmarc, true);
                    } else {
                        if (basket.contains(jmarc.collection, jmarc.recordId, myBasket)) {
                            this.displayMarcRecord(jmarc);
                        } else {
                            basket.createItem(this.prefix, "userprofile/my_profile/basket", jmarc.collection, jmarc.recordId).then( () => {
                                this.$root.$refs.basketcomponent.rebuildBasket()

                                // wait for basket to display record so the display method can update the basket styling 
                                this.displayMarcRecord(jmarc);
                            })
                        
                        }
                    }
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
        }
        
        recup=this
    
        // Top level events
        window.addEventListener("keydown", function(event) {
            // shift
            if (event.keyCode === 16) {
                component.shiftPressed = true;
            }

            // control
            if (event.keyCode === 17) {
                component.controlPressed = true;
            }

            // command (mac)
            if (event.keyCode === 91) {
                component.commandPressed = true;
            }
        });

        window.addEventListener("keyup", function(event) {
            // shift
            if (event.keyCode === 16) {
                component.shiftPressed = false;
            }

            // control
            if (event.keyCode === 17) {
                component.controlPressed = false;
            }

            // command (mac)
            if (event.keyCode === 91) {
                component.commandPressed = false;
            }
        });

        // Cancel popups and stuff
        window.addEventListener("click",  function(event) {
            let dropdown = document.getElementById("typeahead-dropdown")
            dropdown && dropdown.remove();
        });
    },
    methods: {

        // popup warning modal if we have unsaved changes
        warningSave(){
            this.showModalSave=true
        },
 
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


        selectFields(jmarc) {
            // 615
            //let checkBox = document.querySelector(`div#${jmarc.div.id} i#selectRecordButton`)
            //if (checkBox) {checkBox.classList.replace("fa-square","fa-check-square")}
            let recordSelectBox = document.querySelector(`div#${jmarc.div.id} #selectRecordButton`)
            //let fieldCheckBoxes = document.getElementsByClassName("field-checkbox")
            let fieldCheckBoxes = document.querySelectorAll(`div#${jmarc.div.id} input.field-checkbox`)
            if (recordSelectBox.className.includes("fa-square")) {
                recordSelectBox.classList.replace("fa-square","fa-check-square")
                for (let checkbox of fieldCheckBoxes) {
                    checkbox.checked = false
                    checkbox.click()
                }
            } else {
                recordSelectBox.classList.replace("fa-check-square","fa-square")
                for (let checkbox of fieldCheckBoxes) {
                    checkbox.checked = true
                    checkbox.click()
                }
            }
            //console.log(this.copiedFields)
        },
        toggleSelectField(e, jmarc, field) {
            // We automatically add the contents of a checked field to the copy stack
            if (e.target.checked) {
                if (!field.row.className.includes("hidden-field")) {
                    if (jmarc.recordId == this.selectedJmarc.recordId) {
                        this.selectedFields.push(field);
                    }
                    this.copiedFields.push(field);                        
                }
            } else {
                if (this.copiedFields) {
                    // remove from the list of copied fields
                    this.copiedFields.splice(this.copiedFields.indexOf(field, 1))
                    if (jmarc.recordId==this.selectedJmarc.recordId)
                    {
                        this.selectedFields.splice(this.selectedFields.indexOf(field, 1))
                    }
                   
                }
            }
        },
        async saveRecord(jmarc, display=true){
            if (jmarc.workformName) {
                jmarc.saveWorkform(jmarc.workformName, jmarc.workformDescription).then( () => {
                    this.removeRecordFromEditor(jmarc); // div element is stored as a property of the jmarc object
                    if (display) this.displayMarcRecord(jmarc, false);
                    this.callChangeStyling(`Workform ${jmarc.collection}/workforms/${jmarc.workformName} saved.`, "d-flex w-100 alert-success")
                });
            } else if (! jmarc.saved) {
                // get rid of empty fields and validate
                let flags = jmarc.validationWarnings();
                flags.forEach(x => {this.callChangeStyling(x.message, "d-flex w-100 alert-danger")});
                
                if (flags.length > 0) return

                jmarc.getDataFields().forEach(field => {
                    field.subfields.forEach(subfield => {
                        if (! subfield.value || subfield.value.match(/^\s+$/)) {
                            field.deleteSubfield(subfield);
                        }

                        subfield.validationWarnings().forEach(x => {
                            this.callChangeStyling(`${field.tag}$${subfield.code}: ${x.message}`, "d-flex w-100 alert-danger");
                            flags.push(x)
                        })
                    });

                    field.validationWarnings().forEach(x => {
                        this.callChangeStyling(`${field.tag}: ${x.message}`, "d-flex w-100 alert-danger");
                        flags.push(x)
                    })
                });

                if (flags.length > 0) return

                // start the pending spinner
                jmarc.saveButton.classList.add("fa-spinner");
                jmarc.saveButton.classList.add("fa-pulse");
                jmarc.saveButton.style = "pointer-events: none";

                // dupe auth check
                if (jmarc.collection === "auths") {
                    let headingField = jmarc.fields.filter(x => x.tag.match(/^1/))[0];

                    if (headingField) { 
                        // wait for the result
                        let inUse = await jmarc.authHeadingInUse().catch(error => {throw error});
                        let headingString = headingField.subfields.map(x => x.value).join(" ");
                        let isNewVal = JSON.stringify(headingField.savedState) !== JSON.stringify(headingField.compile());
                        
                        if (inUse === true && headingField.tag === "100" && isNewVal) {
                            // new record personal name exception
                            let msg = `The heading "${headingString}" is already in use by another authority record. Are you sure you want to save the record with a duplicate heading?`;

                            if (! window.confirm(msg)) {
                                return
                            }
                        } else if (headingField.tag !== "100" && inUse === true && isNewVal) {
                            this.callChangeStyling(`The heading "${headingString}" is already in use. Headings for records with tag ${headingField.tag} cannot be duplicated`, "d-flex w-100 alert-danger")
                            return
                        }
                    }
                }

                //save
                let promise = jmarc.recordId ? jmarc.put() : jmarc.post();
 
                promise.then(returnedJmarc => {
                    jmarc.saveButton.classList.remove("fa-spinner");
                    jmarc.saveButton.classList.remove("fa-pulse");
                    jmarc.saveButton.style = "pointer-events: auto";
                    this.removeRecordFromEditor(jmarc,true); // div element is stored as a property of the jmarc object
                    if (display) this.displayMarcRecord(jmarc, false);
                    this.callChangeStyling("Record " + jmarc.recordId + " has been updated/saved", "d-flex w-100 alert-success")
                    basket.createItem(this.prefix, "userprofile/my_profile/basket", jmarc.collection, jmarc.recordId)
                    
                    for (let field of jmarc.fields.filter(x => ! x.tag.match(/^00/))) {
                        for (let subfield of field.subfields) {
                            subfield.copied = false;
                        }
                    }

                }).catch(error => {
                    jmarc.saveButton.classList.remove("fa-spinner");
                    jmarc.saveButton.classList.remove("fa-pulse");
                    jmarc.saveButton.style = "pointer-events: auto";
                    this.callChangeStyling(error.message.substring(0, 100), "d-flex w-100 alert-danger");
                });
            }
        },
        cloneRecord(jmarc) {
            let recup = jmarc.clone();
            if (jmarc.divID) {
                this.removeRecordFromEditor(jmarc); // div element is stored as a property of the jmarc object
            }
            if (jmarc.workformName) {
                this.callChangeStyling("Workform " + jmarc.workformName + " has been cloned and removed from the editor. Displaying new record", "d-flex w-100 alert-success")
            } else {
                this.callChangeStyling("Record " + jmarc.recordId + " has been cloned and removed from the editor. Displaying new record", "d-flex w-100 alert-success")
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
            this.displayMarcRecord(jmarc,false)  
                
            if (jmarc.undoredoIndex!==0) {
                // jmarc.saveButton.classList.add("fa-spinner");
                jmarc.saveButton.classList.add("text-danger");
                jmarc.saveButton.title = "unsaved changes";
            }
        },

        // redo feature
        moveUndoredoIndexRedo(jmarc){
            jmarc.moveUndoredoIndexRedo()
            this.removeRecordFromEditor(jmarc,true)
            this.displayMarcRecord(jmarc,false)   
            if (jmarc.undoredoIndex !== 0) {
                jmarc.saveButton.classList.add("text-danger");
                jmarc.saveButton.title = "unsaved changes";
            }   
        },
        pasteField(jmarc){
            if (this.copiedFields.length === 0) {
                this.callChangeStyling("No fields are selected to paste", "d-flex w-100 alert-danger")
                return
            }
            //console.log(this.copiedFields)

            let seen = [];

            // paste fields 
            for (let field of this.copiedFields || []) {
                // get index of row of next highest tag
                let rowIndex = jmarc.fields.map(x => x.tag).filter(x => parseInt(field.tag) >= parseInt(x)).length;

                // recreate the field
                let newField = jmarc.createField(field.tag);
                newField.indicators = field.indicators || ["_", "_"];
                
                for (let subfield of field.subfields) {
                    let newSubfield = newField.createSubfield(subfield.code);
                    newSubfield.value = subfield.value;
                    newSubfield.xref = subfield.xref;
                    seen.push(newSubfield)
                }
            }

            // refresh
            this.removeRecordFromEditor(jmarc,true);
            this.displayMarcRecord(jmarc,false);
            seen[0].valueSpan.focus();
            seen[0].valueSpan.blur();

            // clear the list of copied items
            this.copiedFields = [];
            
            // clear all checkboxes
            for (let checkbox of document.getElementsByClassName("field-checkbox")) {
                checkbox.checked = false;
            }

            for (let checkBox of document.getElementsByClassName("fa-check-square")) {
                checkBox.classList.replace("fa-check-square", "fa-square")
            }
            
            // Manage visual indicators
            this.checkSavedState(jmarc);
                          
        },
        deleteSubFieldFromShort(jmarc){
            // delete subfield   
            let field = jmarc.getDataFields().filter(x => x.selected)[0];

            if (! field) {
                this.callChangeStyling("No subfield selected", "d-flex w-100 alert-danger")
                return 
            }

            if (field.subfields.length == 1) {
                this.callChangeStyling("Can't delete the field's only subfield", "d-flex w-100 alert-danger");
                return
            }

            let subfield = field.subfields.filter(x => x.selected)[0];
            let subfieldIndex = field.subfields.indexOf(subfield);
            
            if (! subfield) {
                this.callChangeStyling("No subfield selected", "d-flex w-100 alert-danger")
                return 
            }
                   
            // Remove the subfield from the field
            field.deleteSubfield(subfield);
            // Remove the subfield row from the table
            field.subfieldTable.deleteRow(subfield.row.rowIndex);

            // auto select the next subfield, or else the field before it
            if (field.subfields[subfieldIndex]) {
                field.subfields[subfieldIndex].valueSpan.focus();
            } else {
                field.subfields[field.subfields.length - 1].valueSpan.focus()
            }
   
            // Manage visual indicators
            this.checkSavedState(jmarc);
            this.callChangeStyling(`${field.tag}$${subfield.code} has been deleted`, "d-flex w-100 alert-success")
        },
        addSubField(jmarc) {
            // add blank subfield
            let field = jmarc.getDataFields().filter(x => x.selected)[0];

            if (! field) {
                this.callChangeStyling("No subfield selected", "d-flex w-100 alert-danger")
                return 
            }

            let subfield = field.subfields.filter(x => x.selected)[0];
            
            if (! subfield) {
                this.callChangeStyling("No subfield selected", "d-flex w-100 alert-danger")
                return 
            }

            if (subfield.selected) {
                let place = field.subfields.indexOf(subfield) + 1;
                let newSubfield = field.createSubfield("_", place);
                newSubfield.value = "";
                newSubfield = this.buildSubfieldRow(newSubfield, place);
                newSubfield.codeSpan.focus();

                newSubfield.valueCell.classList.add("unsaved");
                this.checkSavedState(jmarc);

                this.callChangeStyling(`${field.tag}$${subfield.code} has been added`, "d-flex w-100 alert-success")

                return newSubfield
            }
        },
        moveSubfield(jmarc, direction=1) {
            let field = jmarc.getDataFields().filter(x => x.selected)[0];
            let dirText = "down"
            if (direction < 0) {
                dirText = "up"
            }
            let subfield = field.subfields.filter(x => x.selected)[0];

            let fromPlace = field.subfields.indexOf(subfield)
            let toPlace = fromPlace + direction

            if (toPlace < 0 || toPlace >= field.subfields.length)  {
                this.callChangeStyling(`Can't move first subfield up or last subfield down.`, "d-flex w-100 alert-warning")
                return
            }

            field.subfields.splice(toPlace, 0, field.subfields.splice(fromPlace, 1)[0])

            this.removeRecordFromEditor(jmarc);
            this.displayMarcRecord(jmarc);

            subfield.valueCell.classList.add("unsaved");
            
            this.checkSavedState(jmarc);
            this.callChangeStyling(`${field.tag}$${subfield.code} ${subfield.value} has been moved ${dirText}`, "d-flex w-100 alert-success")

            return
        },
        addField(jmarc, newField=null, rowIndex=null) {
            let currentField = jmarc.getDataFields().filter(x => x.selected)[0];
            let component = this

            if (currentField.tag === "___") {
                this.callChangeStyling("Can't add new field until active field has a tag", "d-flex w-100 alert-danger");
                return
            }

            if (rowIndex === null) {
                // add a field below the active field
                rowIndex = currentField.row.rowIndex - 2;

                if (! currentField) {
                    this.callChangeStyling("No field selected", "d-flex w-100 alert-danger")
                    return 
                }
            }

            if (newField === null) {
                let place = jmarc.getFields(currentField.tag).indexOf(currentField) + 1;
                newField = jmarc.createField(currentField.tag, place) //, (rowIndex - 1 /*account for 2 header rows*/) + 1);
                newField.tag = "___";
                newField.indicators = ["_", "_"];
            
                let newSubfield = newField.createSubfield();
                newSubfield.code = "_";
                newSubfield.value = "";
            }
            
            let newFieldRow = this.buildFieldRow(newField, rowIndex);
            // trigger field check state events
            newFieldRow.ind1Span.focus();
            newFieldRow.ind2Span.focus();
            newFieldRow.subfields[0].codeSpan.focus();
            newFieldRow.subfields[0].valueSpan.focus();
            newFieldRow.tagSpan.focus();

            newFieldRow.tagCell.addEventListener("change", function (e) {
                // Differentiate kinds of bibs based on 089 contents
                // At worst this will still default to bibs
                let vcoll = jmarc.collection
                if( vcoll == "bibs") {
                    let recordType = null
                    let _089 = jmarc.getField("089")
                    
                    if (_089) {
                        let _089_a = _089.getSubfield("b").value
                        //console.log(recordType)
                        if (_089_a && _089_a == "B22") {
                            vcoll = "speeches"
                        } else if (_089_a && _089_a == "B23") {
                            vcoll = "votes"
                        }  
                    }  
                }
                //console.log(vcoll)
                let validatedField = validationData[vcoll][e.target.value]
                if (!validatedField) {
                    // fallback so we don't have to re-specify fields unnecessarily
                    validatedField = validationData[jmarc.collection][e.target.value]
                }
                if (validatedField) {
                    let blankSubfield = newField.getSubfield("_", 0)
                    newField.deleteSubfield(blankSubfield)
                    newFieldRow.subfieldTable.deleteRow(blankSubfield.row.rowIndex)
                    for (let defaultSubfield of validatedField["defaultSubfields"]) {
                        let newSubfield = newField.createSubfield(defaultSubfield)
                        newSubfield.value = ""
                        component.buildSubfieldRow(newSubfield);
                    }
                    // trigger field check state events, needs to be done again if field changes
                    newFieldRow.ind1Span.focus();
                    newFieldRow.ind2Span.focus();
                    for (let subfield of newField.subfields) {
                        subfield.codeSpan.focus();
                        subfield.valueSpan.focus();
                    }
                    newFieldRow.tagSpan.focus();
                }
            })
            
            // select new field
            this.fieldSelected(newField);
            
            // record state
            this.checkSavedState(jmarc);

            // call the snapshot
            // UndoredoEntry("from adding a field")

            return newField
        },
        deleteFields(jmarc) {
            // deletes all checked fields (contained in this.copiedFields)

            if (this.copiedFields.length === 0) {
                this.callChangeStyling("No fields selected", "d-flex w-100 alert-danger")
                return
            }

            // clone the array so it is not altered during the loop
            let toDelete = [...this.copiedFields];

            for (let field of [...toDelete]) {
                this.deleteField(jmarc, field);
            }

            //this.removeRecordFromEditor(jmarc);
            //this.displayMarcRecord(jmarc);
            
            this.callChangeStyling(`Selected fields have been deleted`, "d-flex w-100 alert-success")

        },
        deleteField(jmarc, field=null){ 
            // delete the selected field, or the field supplied by the args if it exists
            field = field || jmarc.fields.filter(x => x.selected)[0];

            if (! field) {
                this.callChangeStyling("No field selected", "d-flex w-100 alert-danger")
                return
            }
            
            if (jmarc.getDataFields().length === 1) {
                // this is the record's only field
                this.callChangeStyling("Can't delete record's only field", "d-flex w-100 alert-danger")                       
                return
            }                   
            
            let fieldIndex = jmarc.fields.indexOf(field);
            jmarc.deleteField(field);
            let myTable=document.getElementById(this.selectedDiv).firstChild 
            myTable.deleteRow(field.row.rowIndex);

            // auto select the next field, or else the field before it
            if (jmarc.fields[fieldIndex]) {
                jmarc.fields[fieldIndex].subfields[0].valueSpan.focus();
            } else {
                jmarc.fields[fieldIndex - 1].subfields[0].valueSpan.focus();
            }

            // remove the field from the copied fields stack
            let i = this.copiedFields.indexOf(field);
            
            if (i > -1) {
                this.copiedFields.splice(i, 1);
            }
 
            // Manage visual indicators
            this.checkSavedState(jmarc);

            this.callChangeStyling(`${field.tag} has been deleted`, "d-flex w-100 alert-success")

        },
        deleteRecord(jmarc) {
            if (jmarc.workformName) {
                if (confirm("Are you sure you want to delete Workform ?") == true) {
                    Jmarc.deleteWorkform(jmarc.collection, jmarc.workformName).then( () => {
                        this.removeRecordFromEditor(jmarc);
                        this.callChangeStyling(`Workform ${jmarc.collection}/workforms/${jmarc.workformName} has been deleted`, "d-flex w-100 alert-success")
                        //this.removeFromBasket(jmarc.recordId, jmarc.collection)                 
                    })
                }
            } else {
                if (confirm("Are you sure you want to delete this record ?") == true) {
                    let deletedRid = jmarc.recordId;
                    let deletedColl = jmarc.collection;

                    jmarc.deleteButton.classList.add("fa-spinner");
                    jmarc.deleteButton.classList.add("fa-pulse");
                    jmarc.deleteButton.style = "pointer-events: none";
 
                    jmarc.delete().then( () => {
                        this.removeRecordFromEditor(jmarc);
                        this.callChangeStyling(`Record ${deletedColl}/${deletedRid} has been deleted`, "d-flex w-100 alert-success");
                        //this.$root.$refs.basketcomponent.removeRecordFromList(jmarc.collection, jmarc.recordId)
                        this.$root.$refs.basketcomponent.rebuildBasket()
                    }).catch( error => {
                        this.callChangeStyling(error.message,"d-flex w-100 alert-danger");
                    });
                }
            }
 
        },
        saveToWorkform(jmarc) {
            jmarc.workformName = "<new>";
            jmarc.workformDescription = " ";
            jmarc.newWorkForm = true;
            this.removeRecordFromEditor(jmarc,true); // div element is stored as a property of the jmarc object
            this.displayMarcRecord(jmarc, false);
            this.callChangeStyling("Name your new workform, then click the Save button", "d-flex w-100 alert-warning")
            jmarc.saveButton.onclick = () => {
                jmarc.saveAsWorkform(jmarc.workformName, jmarc.workformDescription).then( () => {
                    this.removeRecordFromEditor(jmarc,true); // div element is stored as a property of the jmarc object
                    this.displayMarcRecord(jmarc, false);
                    this.callChangeStyling(`Workform ${jmarc.collection}/workforms/${jmarc.workformName} saved.`, "d-flex w-100 alert-success")
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
            this.selectedRecord = jmarc.recordId
            this.selectedDiv=jmarc.div.id
            this.selectedJmarc=jmarc
            let idRow = document.querySelector(`div#${this.selectedDiv} thead tr`)
            if (idRow) {idRow.style.backgroundColor = "#009edb"}
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
        approveAuth(jmarc) {
            this.selectedFields.push
            let newField = jmarc.createField("999")
            let newSubfield = newField.createSubfield("c")
            newSubfield.value = "t"
            newField = this.buildFieldRow(newField);
            newField.tagSpan.focus();
            //document.execCommand("selectall");
            newField.subfields[0].valueCell.classList.add("unsaved");

            // Manage visual indicators
            this.checkSavedState(jmarc);

        },

        ///////////////////////////////////////////////////
        //  definition of the listeners for the shortcuts
        ///////////////////////////////////////////////////

        addHelpListener(event) {
            // check if one record is selected
            if (event.ctrlKey && event.key === "h"){
                event.preventDefault();
                alert("Shortcuts implemented: "+ "\n" +"-----------------------------------------------------------------"+
                 "\n" +"Esc => Close the window of the record selected"+
                 "\n"+"ctrl + s => Save the record selected"+
                 "\n"+"ctrl + ENTER => Add a new field to the record selected"+
                 "\n"+"ctrl + k => remove the field from the record selected" +
                 "\n"+"ctrl + / => Add a new subField to the record selected"+
                 "\n"+"ctrl + m => remove the last subField selected from the record selected"+
                 "\n"+"ctrl + p => paste/duplicate previously selected/copied fields"+
                 "\n"+"ctrl + h => Display help menu" +
                 "\n"+"ctrl + q => Change the selected record" +
                 "\n"+"ctrl + r => Refresh the page"
                 );
            }    
        },
        changeSelectedRecordListener(event) {
            if (this.selectedRecord!=="" && !this.historyMode)
                if (this.isRecordOneDisplayed==true && this.isRecordTwoDisplayed==true)
                    if (event.ctrlKey && event.key === "q"){
                        if (this.selectedJmarc.recordId===this.displayedJmarcObject[0].recordId){
                            this.selectRecord(this.displayedJmarcObject[1])
                        }
                        else{
                            this.selectRecord(this.displayedJmarcObject[0])
                        }
                    }
        }, 
        pasteFieldListener(event) {
            if (this.selectedRecord!=="" && !this.historyMode)
            {
                if (event.ctrlKey && event.key === "p"){
                    event.preventDefault();
                    this.pasteField(this.selectedJmarc)
                }
            }
           
        },  
        refreshPageListener(event) {
            if (this.selectedRecord!=="" && !this.historyMode)
            {
                if (event.ctrlKey && event.key === "r"){
                    event.preventDefault();
                    window.location.reload();
                }
            }
           
        },
        addSubFieldListener(event) {
            if (this.selectedRecord!=="" && !this.historyMode)
            {
                if (event.ctrlKey && event.key === "/"){
                    event.preventDefault();
                    this.addSubField(this.selectedJmarc)
                }
            }
           
        },
        deleteSubFieldListener(event) {
            if (this.selectedRecord!=="" && !this.historyMode)
            {
                if (event.ctrlKey && event.key === "m"){
                    event.preventDefault();
                    this.deleteSubFieldFromShort(this.selectedJmarc)
                }
            }
           
        },    
        addFieldListener(event) {
            if (this.selectedRecord!=="" && !this.historyMode)
            {
                if (event.ctrlKey && event.key === "Enter"){
                    event.preventDefault();
                    this.addField(this.selectedJmarc)
                }
            }
           
        },
        deleteFieldListener(event) {
            if (this.selectedRecord!=="" && !this.historyMode)
            {
                if (event.ctrlKey && event.key === "k"){
                    event.preventDefault();

                    if (this.copiedFields.length > 0) {
                        // there are fields checked
                        this.deleteFields(this.selectedJmarc);
                    } else {
                        // deletes only the active field
                        this.deleteField(this.selectedJmarc);
                    }
                }
            }
           
        },
        saveRecordListener(event) {
            if (this.selectedRecord!=="" && !this.historyMode)
            {
                if (event.ctrlKey && event.key === "s") {
                    event.preventDefault();
                    this.saveRecord(this.selectedJmarc)
 
                }
            }
           
        },
        removeRecordListener(event) {
            if (this.selectedRecord !== "" && ! this.historyMode) {
                if (event.key == "Escape") {
                    event.preventDefault();
                    //this.userClose(this.selectedJmarc)
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
                myRecord1.className="col-sm-12 mt-1 pb-2"
            }
 
            // // only record2 displayed
            if (this.isRecordOneDisplayed == false && this.isRecordTwoDisplayed == true){
                let myDiv=document.getElementById("records")
               
                // change the class
                myDiv.className="ml-3"
 
                // get the record1 div and change the style
                let myRecord2=document.getElementById("record2")
 
                // change the class
                myRecord2.className="col-sm-12 mt-1 pb-2"
            }
 
            // restore the default values
            if (this.isRecordOneDisplayed == true && this.isRecordTwoDisplayed == true){
                let myDiv=document.getElementById("records")
               
                // change the class
                myDiv.className="row ml-3"
 
                // get the record1 div and change the style
                let myRecord1=document.getElementById("record1")
 
                // change the class
                myRecord1.className="col-sm-6 mt-1 pb-2"
 
                // get the record2 div and change the style
                let myRecord2=document.getElementById("record2")
 
                // change the class
                myRecord2.className="col-sm-6 mt-1 pb-2"   
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

            // change color header
            let selectedHeader=document.getElementsByTagName("thead")
            let selectedHeadersArray=Array.from(selectedHeader)
            selectedHeadersArray.forEach(element => {
                element.firstChild.style.backgroundColor = "#F2F2F2";
            })
 
            // clean the variables
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
        getHistorylabel(){
            return "(History record)"
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

        closeModal() {
            this.showModal = false;
        },

        closeModalSave() {
            this.showModalSave = false;
        },
        
        async getRecordView(collection) {
            let content= `/views/${collection}`
            let url = `${this.prefix}${content}`
            let recordCollection=[]
            try {
                const response = await fetch(url);
                const jsonData = await response.json();
                jsonData.data.forEach(item=>{
                    if (item.collection===collection){
                        // save the item inside the array
                        recordCollection.push(item)
                    }
                })
            }
            catch(error){
                this.callChangeStyling(error.message.substring(0, 100), "d-flex w-100 alert-danger");    
            }
            
            return recordCollection 
        },

        async displayHistoryModalToGetRecordView(jmarc){
            
            if (this.isFiltered==false)
                {
                this.showModal=true;
                
                // change the title of the modal
                let myTitleModal=document.getElementById("titlemodal")
                myTitleModal.innerText="Choose record view"

                // insert the parent div inside the content history    
                let recup=document.getElementById("contenthistory")
                recup.innerHTML=""

                // creation of the parent div for the progress bar
                let parentProgressBarDiv=document.createElement("div");
                parentProgressBarDiv.classList.add("d-flex");
                parentProgressBarDiv.classList.add("align-items-center");
                parentProgressBarDiv.classList.add("mt-4");
                parentProgressBarDiv.classList.add("ml-4");
                parentProgressBarDiv.id="progressBar"
                parentProgressBarDiv.style.border = "none"
                parentProgressBarDiv.style.width= "auto"

                // creation of the h3
                let myH3=document.createElement("H3");
                myH3.innerHTML="Loading....."

                parentProgressBarDiv.appendChild(myH3)

                // creation of the div for the progress bar
                let progressBarDiv=document.createElement("div");
                progressBarDiv.classList.add("spinner-border");
                progressBarDiv.classList.add("ms-auto");
                progressBarDiv.setAttribute("role", "status");
                progressBarDiv.setAttribute("aria-hidden", "true");
                
                parentProgressBarDiv.appendChild(progressBarDiv)

                recup.appendChild(parentProgressBarDiv)

                                    
                // transfer reference
                let that=this

                try {
                    // call the API route to get the views

                    let result=await this.getRecordView(jmarc.collection)
                    recup.innerHTML=""
                    if (result.length>0){
                        result.forEach(element=>{

                                // creation of the first div
                                let firstDiv=document.createElement("div")
                                //firstDiv.classList.add("card-body");
                                //firstDiv.classList.add("mt-2");
                                firstDiv.style.border = "none"
                                firstDiv.style.width= "auto"

                                // adding the contents to the div
                                firstDiv.innerHTML= `<strong> ${element.name} </strong>` 
                                //firstDiv.innerHTML+= `Collection:<strong> ${element.collection} </strong><br>` 
                                // firstDiv.innerHTML+= `Url:<strong> ${element.url} </strong>` 

                                // adding some events on mouverover / mouseout to change background color
                                firstDiv.addEventListener("mouseover",()=>{
                                    firstDiv.style.backgroundColor="#87CEFA"
                                })

                                firstDiv.addEventListener("mouseout",()=>{
                                    firstDiv.style.backgroundColor=""
                                })

                                // adding some events on mouverover / mouseout to change background color
                                firstDiv.addEventListener("click",async ()=>{

                                    try {
                                        const response = await fetch(element.url);
                                        const jsonData = await response.json();
                                        that.closeModal()
                                        let myFilter=[]
                                        myFilter.push(jsonData.data)
                                        let myIcon=document.getElementById("recordViewButton")
                                        myIcon.className=""
                                        myIcon.className="fa fa-times float-left p-1 record-control"
                                        that.isFiltered=true
                                        that.filterRecordView(jmarc,myFilter)
                                        
                                    }
                                    catch(error){
                                        this.callChangeStyling(error.message.substring(0, 100), "d-flex w-100 alert-danger");    
                                    }
                                })
                                recup.appendChild(firstDiv)
                        })
                    } 
                    if (result.length===0){
                        // creation of the first div
                        let firstDiv=document.createElement("div")
                        firstDiv.classList.add("card-body");
                        firstDiv.classList.add("mt-2");
                        firstDiv.classList.add("alert");
                        firstDiv.classList.add("alert-warning");
                        firstDiv.style.border = "none"
                        firstDiv.style.width= "auto"

                        // adding the contents to the div
                        firstDiv.innerHTML= `<strong> Sorry, no match!!!</strong>` 

                        recup.appendChild(firstDiv)
                    
                    }
                }
                catch (error) {
                    this.callChangeStyling(error.message.substring(0, 100), "d-flex w-100 alert-danger");
                }
            } else {
                // change the value of isfiltered
                this.isFiltered=false
                // change the icone and re-display the record
                let myIcon=document.getElementById("recordViewButton")
                myIcon.className=""
                myIcon.className="fas fa-filter float-left p-1 record-control"
                // reload the record
                this.removeRecordFromEditor(jmarc,true)
                this.displayMarcRecord(this.selectedJmarc)
            }
        },
        displayHistoryModal(jmarc){
            this.showModal=true;
            
            // change the title of the modal
            let myTitleModal=document.getElementById("titlemodal")
            myTitleModal.innerText="Choose history record"

            // insert the parent div inside the content history    
            let recup=document.getElementById("contenthistory")
            recup.innerHTML=""

            // creation of the parent div for the progress bar
            let parentProgressBarDiv=document.createElement("div");
            parentProgressBarDiv.classList.add("d-flex");
            parentProgressBarDiv.classList.add("align-items-center");
            parentProgressBarDiv.classList.add("mt-4");
            parentProgressBarDiv.classList.add("ml-4");
            parentProgressBarDiv.id="progressBar"
            parentProgressBarDiv.style.border = "none"
            parentProgressBarDiv.style.width= "auto"

            // creation of the h3
            let myH3=document.createElement("H3");
            myH3.innerHTML="Loading....."

            parentProgressBarDiv.appendChild(myH3)

            // creation of the div for the progress bar
            let progressBarDiv=document.createElement("div");
            progressBarDiv.classList.add("spinner-border");
            progressBarDiv.classList.add("ms-auto");
            progressBarDiv.setAttribute("role", "status");
            progressBarDiv.setAttribute("aria-hidden", "true");
            
            parentProgressBarDiv.appendChild(progressBarDiv)

            recup.appendChild(parentProgressBarDiv)

                                
            // transfer reference
            let that=this

            try {
                jmarc.history()
                    .then(function(result) {
    
                        recup.innerHTML=""
                        result.forEach(element=>{

                        // creation of the first div
                        let firstDiv=document.createElement("div")
                        //firstDiv.classList.add("card");
                        //firstDiv.classList.add("mt-2");
                        firstDiv.style.border = "none"
                        firstDiv.style.width= "auto"

                        // adding the contents to the div
                        let tmpDate = new Date(element.updated);
                        !(element.user) ? firstDiv.innerHTML= `<strong> ${tmpDate} </strong>` : firstDiv.innerHTML= `<strong> ${tmpDate} </strong> , user : ${element.user} `

                        // adding some events on mouverover / mouseout to change background color
                        firstDiv.addEventListener("mouseover",()=>{
                            firstDiv.style.backgroundColor="#87CEFA"
                        })

                        firstDiv.addEventListener("mouseout",()=>{
                            firstDiv.style.backgroundColor=""
                        })

                        // adding some events on mouverover / mouseout to change background color
                        firstDiv.addEventListener("click",()=>{

                            if (that.displayedJmarcObject.length===1){
                                // recordiD to the history record for displaying purpose
                                element.recordId=that.selectedJmarc.recordId
                                that.historyJmarcHistory=element
                                that.historyJmarcOriginal=that.selectedJmarc
                                that.closeModal()
                                that.displayHistoryEditorView(that.selectedJmarc,true)
                            } else {
                                that.closeModal()
                                that.callChangeStyling("First remove a record from the stage", "d-flex w-100 alert-danger");
                            }
                        })
                        recup.appendChild(firstDiv)
                        })
                    });
            }
            catch (error) {
                this.callChangeStyling(error.message.substring(0, 100), "d-flex w-100 alert-danger");
            }
        },

        displayHistoryEditorView(jmarcToKeep){

            // remove all the records from the editor stage keeping the undorecord
            this.displayedJmarcObject.forEach(element=>{
                (element===jmarcToKeep)? this.removeRecordFromEditor(element,true): this.removeRecordFromEditor(element,false)
            })

            // display the "original" record
            this.displayMarcRecord(this.historyJmarcOriginal)

            // change the mode
            this.historyMode=true

            // put the history record on read only mode
            //this.historyJmarcHistory.readOnly=true
            //console.log(this.historyJmarcHistory.readOnly)

            let recordDiff = this.historyJmarcHistory.diff(this.historyJmarcOriginal)
            recordDiff.readOnly = true
            recordDiff.recordId = this.historyJmarcOriginal.recordId

            // display the "history" record
            this.displayMarcRecord(recordDiff)

            let myTable = document.getElementById('record2');
            let mySpan0 = myTable.getElementsByTagName('span');
            for (let t = 0; t < mySpan0.length; t++){
                mySpan0[t].contentEditable="false";
            }

            for (let el of myTable.querySelectorAll('[data-toggle="dropdown"]')) {
                el.classList.add("disabled")
            }

            this.filterRecordView(this.historyJmarcOriginal)
            
           
        },

        // filter the record view according the filter view parameter e.g : itp view
        //filterRecordView(record,filter =[ { "collection": "bibs", "fieldsets": [ { "field": "191", "subfields": [ "a", "b", "c", "d" ] }], "name": "ITP" }])
        //filterRecordView(record,filter =[ { "collection": "bibs", "fieldsets": [ { "field": "191", "subfields": [ "a", "b", "c", "d" ] } ,{"field": "245", "subfields": [ "a", "b"] }], "name": "ITP" }])
        filterRecordView(record,filter)
        {
            console.log(typeof(record))
            try {
                    // check the size of the filter
                    if (filter && filter[0].collection===record.collection){ // we should filter on the same collection

                        // retrieve the values
                        let myFieldsets = filter[0].fieldsets
                        let myFields=[]
                        let myName=filter[0].name

                        // load all the fields in an array
                        myFieldsets.forEach(element=> {
                            myFields.push(element.field)
                        })

                        if (filter[0].fieldsets.length>0){
                            
                                    // filter the record according the array of fields (first iteration)
                                    record.fields.forEach(field=>{
                                        
                                        if (!myFields.includes(field.tag)){
                                            // hide the field from the record
                                            field.row.classList.add("hidden-field")
                                        }
                                        else { // tag include in myFields
                                            myFieldsets.forEach(myFieldset=>{
                                                if (myFieldset.field===field.tag) {

                                                        field.subfields.forEach(sfield=>{
                                                            
                                                                if (!myFieldset.subfields.includes(sfield.code)){
                                                                    // hide the field from the record
                                                                    sfield.row.classList.add("hidden-field")
                                                                }
                                                                if (myFieldset.subfields.length===0){
                                                                    // show all the fields from the record
                                                                    sfield.row.classList.remove("hidden-field")
                                                                }
                                                        })
                                                }

                                            })
                                        }
                                    })
                                    this.callChangeStyling(`Record view ${myName} loaded!!!!`, "d-flex w-100 alert-success")
                                } else { // the fieldset is empty
                                    for (let field of record.fields) {
                                        if (field.row.classList.contains("hidden-field")) {
                                            field.row.classList.remove("hidden-field")
                                            field.wasHidden = true;
                                        }
                                        else if (field.wasHidden) {
                                            field.row.classList.add("hidden-field")
                                        }
                                    }
                        }
                    }
                }
            catch(err){
                this.callChangeStyling(`There is an error ${err}!!!!`, "d-flex w-100 alert-danger")
            }

        },

        // revert the jmarc record
        revert(){

            // load the data inside 
            this.historyJmarcOriginal.fields=[]
            this.historyJmarcOriginal.parse(this.historyJmarcHistory.compile())
            // save the record to keep changes
            this.saveRecord(this.historyJmarcOriginal)
            
            // change the mode
            this.historyMode=false

            // clean
            let recup=this.historyJmarcHistory
            this.historyJmarcHistory=""
            this.historyJmarcOriginal=""
            this.removeRecordFromEditor(recup)

            this.callChangeStyling("Record reverted!!!", "d-flex w-100 alert-success")
            
        },
        // userClose(jmarc) {

        //     if(! jmarc.saved) {
        //         this.showModalSave=true
        //         return
        //     }
        //     this.removeRecordFromEditor(jmarc)

        //     // let otherRecord = this.currentRecordObjects[0];

        //     // if (otherRecord) {
        //     //     // reset the div
        //     //     this.removeRecordFromEditor(otherRecord,true);
        //     //     this.displayMarcRecord(otherRecord,false);
        //     //     this.selectRecord(otherRecord);
        //     // }

        //     this.callChangeStyling("Record removed from the editor", "d-flex w-100 alert-success")

        //     return true
        // },
        removeRecordFromEditor(jmarc,keepDataInVector=false) {

            if(! jmarc.saved && !this.historyMode) {
                this.showModalSave=true
                return
            }

            // change the color of the background of the item in the basket
            if (!this.historyMode){
                const myId=jmarc.collection + '--' + jmarc.recordId
                const selectedItem=document.getElementById(myId)
                if (selectedItem) selectedItem.setAttribute("style", "background-color:white;");
            }
            

            // clear the entries for the undoredo vectors
            if (keepDataInVector==false) { 
                jmarc.clearUndoredoVector()
                // stop the timer for undoredo
                jmarc.stopcheckingUndoRedoEntry() 
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
            }
            else if (divID === "record2") {

                this.removeJmarcTodisplayedJmarcObject(this.record2)
                this.$root.$refs.basketcomponent.removeRecordFromRecordDisplayed(this.record2)
                this.record2 = ""
                this.isRecordTwoDisplayed = false
                this.collectionRecord2=""
                let recup=document.getElementById("record2")
                recup.innerHTML=""
            }

            this.currentRecordObjects.splice(this.currentRecordObjects.indexOf(jmarc), 1);

            // optimize the display
            this.selectedRecord=""
            this.optimizeEditorDisplay(this.targetedTable)
            this.targetedTable=""
 
            // check if we still have a record displayed
            if (this.displayedJmarcObject.length>0) {
                //this.selectedRecord = this.displayedJmarcObject[0].recordId
                //this.selectedDiv=this.displayedJmarcObject[0].recordId   
                this.selectRecord(this.displayedJmarcObject[0])

            }

            // change the history mode to false and remove other record if the history mode was activated
            if (this.historyMode==true){
                
                //let recup=this.historyJmarcHistory
                this.historyJmarcHistory=""
                this.historyJmarcOriginal=""
                this.historyMode=false
                
            }
 
            //console.log(this.recordlist.indexOf(`${jmarc.collection}/${jmarc.recordId}`));
            // needed?
            this.recordlist.splice(this.recordlist.indexOf(`${jmarc.collection}/${jmarc.recordId}`), 1);
            let updatedUrl = location.href.replace(/\/editor.*/, `/editor?${this.recordList ? 'records=' : ''}${this.recordlist.join(",")}`);
            window.history.replaceState({}, null, updatedUrl);

            return true
        },
        displayMarcRecord(jmarc, readOnly) {
            let component = this;
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

            // init the undoRedo
            if (jmarc.checkUndoRedoEntry==false) {
                jmarc.startcheckingUndoRedoEntry(5000)
                // set this variable is order to prevent to setup the timer each time
                jmarc.checkUndoRedoEntry=true
            } 
            
            jmarc.div = document.getElementById(myDivId);

            // the display may have been aborted
            if (! jmarc.div) return

            // change the color of the background of the item in the basket
            const myId=jmarc.collection + '--' + jmarc.recordId
            const selectedItem=document.getElementById(myId)

            // set the styling only if the Div exists
            if (selectedItem) selectedItem.setAttribute("style", "background-color: #d5e1f5;");

            // build the record display

            let table = this.buildRecordTable(jmarc,readOnly);
            jmarc.div.appendChild(table); 
            this.selectRecord(jmarc);
            this.currentRecordObjects.push(jmarc);

            // check save state
            this.checkSavedState(jmarc);

            // trigger field level unsaved changes detection
            // preserve scroll location
            let scrollX = window.scrollX;
            let scrollY = window.scrollY;
            let scroll = jmarc.tableBody.scrollTop;

            for (let field of jmarc.getDataFields()) {
                field.tagSpan.focus();
                field.ind1Span.focus();
                field.ind2Span.focus();

                for (let subfield of field.subfields) {
                    subfield.codeSpan.focus();
                    subfield.valueSpan.focus();
                    subfield.valueSpan.blur();
                }
            }

            jmarc.getDataFields()[0].subfields[0].valueSpan.focus();
            jmarc.getDataFields()[0].subfields[0].valueSpan.blur();

            jmarc.tableBody.scrollTop = scroll;
            window.scrollTo(scrollX, scrollY);

            // trigger validation warnings
            this.validationWarnings(jmarc);
            
            // add the jmarc inside the list of jmarc objects displayed
            // only if the array size is under 2
 
            this.addJmarcTodisplayedJmarcObject(jmarc);

            // keep list of records
            let recordString = `${jmarc.collection}/${jmarc.recordId}`;

            if (! this.recordlist.includes(recordString)) {
                this.recordlist.push(recordString)
            }

            // update URL with current open records
            let updatedUrl = location.href.replace(/\/editor.*/, `/editor?records=${this.recordlist.join(",")}`);
            window.history.replaceState({}, null, updatedUrl);

            //////////////////////////////////////////////////////////////////////////////
            // optimize the display just when you have one record displayed
            //////////////////////////////////////////////////////////////////////////////
 
            this.targetedTable=table
            this.optimizeEditorDisplay(table)

            // check if we have some values for the default views
            if (this.myDefaultViews.length>0)
                this.myDefaultViews.forEach(myDefaultView => {
                    if (myDefaultView.collection===jmarc.collection){
                        let myFilter=[]
                        myFilter.push(myDefaultView)
                        this.filterRecordView(jmarc,myFilter)
                    }
                })

            

            // events
            // check for unsaved changes on leaving page

            window.addEventListener("beforeunload", function(event) {
                if (component.currentRecordObjects.indexOf(jmarc) > -1 && ! jmarc.saved) {
                    //most browsers will display a default dialog message no matter what string is returned
                    return event.returnValue = "Warning! You have unsaved changes. Click OK to close without saving or Cancel to resume editing your record."
                }
            });

            return true
        },
        buildRecordTable(jmarc, readOnly) {
            let component = this;
            let table = document.createElement("table");
            jmarc.table = table;

            if (!this.historyMode) {
                table.addEventListener("click", function() {
                let divID = jmarc.div.id
                if ((divID === "record1") && (component.isRecordOneDisplayed)) {
                    component.selectRecord(jmarc) 
                }
                if ((divID === "record2") && (component.isRecordTwoDisplayed)) {
                    component.selectRecord(jmarc) 
                }});
            }
            
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
            
            if (!this.historyMode) {
                // check the save status on any input
                table.addEventListener("input", function() {
                    component.checkSavedState(jmarc);
                });

                table.addEventListener("paste", function() {
                    component.checkSavedState(jmarc);
                });

                // check the save status on mousedown (auth conrrol select)
                table.addEventListener("mousedown", function() {
                    component.checkSavedState(jmarc);
                });
            }
           
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
                {"name": "selectRecordButton", "element": "i", "class": "far fa-square", "title": "Select/Unselect Fields", "click": "selectFields"},
                {"name": "idField", "element": "span", "class": "mx-1", "title": "", "load": "getId" },
                {"name": "countField", "element": "span", "class": "mx-1", "title": "", "load": "getId"},
                {"name": "saveButton", "element": "i", "class": "fas fa-save", "title": "No Unsaved Changes", "click": "saveRecord"},
                {"name": "saveAsButton", "element": "i", "class": "fas fa-share-square", "title": "Save As Workform" ,"click": "saveToWorkform" },
                {"name": "cloneButton", "element": "i", "class": "fas fa-copy", "title": "Clone Record", "click": "cloneRecord" },
                {"name": "pasteButton", "element": "i", "class": "far fa-arrow-alt-circle-down", "title": "Paste Fields", "click": "pasteField" },
                {"name": "toggleButton", "element": "i", "class": "fas fa-solid fa-eye", "title": "Toggle Hidden Fields", "click": "toggleHidden" },
                {"name": "deleteButton", "element": "i", "class": "fas fa-trash-alt", "title": "Delete Record",  "click": "deleteRecord" },
                {"name": "undoButton", "element": "i", "class": "fa fa-undo", "title": "Undo",  "click": "moveUndoredoIndexUndo","param":jmarc},
                {"name": "redoButton", "element": "i", "class": "fa fa-redo", "title": "Redo",  "click": "moveUndoredoIndexRedo","param":jmarc},
                {"name": "historyButton", "element": "i", "class": "fas fa-history", "title": "History",  "click": "displayHistoryModal","param":jmarc},
                {"name": "recordViewButton", "element": "i", "class": "fas fa-filter", "title": "Record View",  "click": "displayHistoryModalToGetRecordView","params":{"jmarc": jmarc} },
                {"name": "removeButton", "element": "i", "class": "fas fa-window-close float-right", "title": `Close Record`, "click": "removeRecordFromEditor"},
            ];
            if (jmarc.workformName) {
                controls = [
                    {"name": "selectRecordButton", "element": "i", "class": "far fa-square", "title": "Select/Unselect Fields", "click": "selectFields"},
                    {"name": "idField", "element": "h5", "class": "mx-2", "title": "", "load": "getId" },
                    {"name": "saveButton", "element": "i", "class": "fas fa-save", "title": "Save Workform", "click": "saveRecord"},
                    {"name": "saveAsButton", "element": "i", "class": "fas fa-share-square", "title": "Save As Record", "click": "cloneRecord" },
                    {"name": "pasteButton", "element": "i", "class": "far fa-arrow-alt-circle-down", "title": "Paste Fields", "click": "pasteField" },
                    {"name": "toggleButton", "element": "i", "class": "fas fa-solid fa-eye", "title": "Toggle Hidden Fields", "click": "toggleHidden" },
                    {"name": "deleteButton", "element": "i", "class": "fas fa-trash-alt", "title": "Delete Workform", "click": "deleteRecord" },
                    {"name": "undoButton", "element": "i", "class": "fa fa-undo", "title": "Undo",  "click": "moveUndoredoIndexUndo","param":jmarc},
                    {"name": "redoButton", "element": "i", "class": "fa fa-redo", "title": "Redo",  "click": "moveUndoredoIndexRedo","param":jmarc},
                    {"name": "removeButton", "element": "i", "class": "fas fa-window-close float-right", "title": `close Workform`, "click": "removeRecordFromEditor"},
                ]
            }
            // history record
            if (this.historyMode){
                controls = [
                    {"name": "idField", "element": "h5", "class": "mx-2", "title": "", "load": "getId" },
                    {"name": "revertButton", "element": "i", "class": "fa fa-undo", "title": "Revert to this revision",  "click": "revert"},
                    {"name": "removeButton", "element": "i", "class": "fas fa-window-close float-right", "title": `Close Record`, "click": "removeRecordFromEditor"}
                ]
            }

            if (jmarc.collection =="auths") {
                controls.push(
                    {"name": "approveAuthButton", "element": "i", "class": "fas fa-check-circle", "title": "Approve Record", "click": "approveAuth"}
                )
            }

            if (this.readonly && this.user !== null) {
                controls = [
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
                    jmarc[control["name"]] = controlButton;
                    if (control["param"]) {
                        controlButton.onclick = () => {
                            this[control["click"]](control["param"]) 
                        }
                    } else if (control["params"]) {
                        if (control["name"] == "editButton") {
                            controlButton.onclick = () => {
                                this[control["click"]](control["params"]["jmarc"], control["params"]["lockedBy"]) 
                            }
                        }
                        if (control["name"] == "recordViewButton") {
                            controlButton.onclick = () => {
                                this[control["click"]](control["params"]["jmarc"], control["params"]["filter"]) 
                            }
                        }
                    } else {
                        controlButton.onclick = () => {
                            this[control["click"]](jmarc) 
                        }
                    }
                    
               } else {
                    if (jmarc.workformName) {
                        controlButton.innerText = `${jmarc.collection}/workforms/${jmarc.workformName}`;
                    } else if (this.historyMode==true){
                        controlButton.innerText = `${jmarc.collection}/${jmarc.recordId} (history record)`;
                    } else if (control["name"] == "countField" && jmarc.recordId && jmarc.collection == "auths") {
                        let url = `${this.prefix}marc/auths/records/${jmarc.recordId}/use_count?use_type=bibs`;
                        let uiBase = this.prefix.replace("/api", "")
                        fetch(url).then(
                            response => response.json()
                        ).then( json => {
                            controlButton.innerHTML = `(<a class="text-dark" href="${uiBase}records/bibs/search?q=xref:${jmarc.recordId}">${json.data}</a>)`
                            controlButton.title = "Authority use count (bibs)"
                        })
                    } else if (control["name"] == "idField") {
                        let recordId = jmarc.recordId ? jmarc.recordId : "<New Record>"
                        controlButton.innerText = `${jmarc.collection}/${recordId}`;
                    }

                    controlButton.className = `${control["class"]} float-left`;
                }
                
            }

            if (this.user != null) {
                let auditRow = tableHeader.insertRow()
                let auditCell = auditRow.insertCell()
                auditCell.colSpan = 6
                auditCell.className = "text-wrap"
                let auditSpan = document.createElement("span")
                auditSpan.className = "small mx-2"
                
                auditCell.appendChild(auditSpan)
                jmarc.history().then( (history) => {
                    if (history.length > 0) {
                        auditSpan.innerText = `Last updated ${jmarc.updated} by ${history[history.length-1].user}`
                    }
                    else {
                        auditSpan.innerText = `Last updated ${jmarc.updated} by system import.`
                    }
                })
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
            // diff-bg
            field.row = tableBody.insertRow(place);
            if (field.isDiff) {
                field.row.setAttribute("style","background-color:cyan;")
            }
   
            // add the checkboxes
            let checkCell = field.row.insertCell();
            checkCell.className = "field-checkbox";
            let inputCheckboxCell = document.createElement("input");
            inputCheckboxCell.className = "field-checkbox";
            inputCheckboxCell.setAttribute("type","checkbox")
            // adding the checkbox only if we are not in dual mode
            if (!this.historyMode) checkCell.appendChild(inputCheckboxCell)
   
            // the instance of the calling object
            // let that = component;
 
            // define the on click event
            checkCell.addEventListener('click', (e) => this.toggleSelectField(e, jmarc, field))

            // tag container cell
            let tagContainerCell = field.row.insertCell();
            tagContainerCell.classList.add("tag-container");

            // Field Table
            let fieldTable = document.createElement("table");
            tagContainerCell.append(fieldTable);

            let tagRow = fieldTable.insertRow();
            // menu
            let menuCell = tagRow.insertCell();
            let tagMenu = document.createElement("div");
            menuCell.append(tagMenu);
            //tagMenu.tabIndex = 0;
            tagMenu.className = "dropdown-menu tag-menu";
            let menuButton = document.createElement("button");
            menuCell.appendChild(menuButton);
            menuButton.className = "fa fa-bars field-menu";
 
            // enable elems to toggle menu
            menuButton.setAttribute("data-toggle", "dropdown");
 
            // menu item add field
            let addField = document.createElement("i");
            tagMenu.append(addField);
            addField.className = "dropdown-item";
            addField.innerText = "Add field";
   
            // menu item delete field
            let deleteField = document.createElement("i");
            tagMenu.append(deleteField);

            deleteField.className = "dropdown-item";
            deleteField.innerText = "Delete field";

            // menu item Delete All Checked
            let deleteMultiField = document.createElement("i")
            tagMenu.append(deleteMultiField)

            deleteMultiField.className = "dropdown-item"
            deleteMultiField.innerText = "Delete Selected Field(s)"
            if (!this.historyMode) {
                deleteMultiField.addEventListener("click", () => this.deleteFields(jmarc))
            }

            // Tag
            let tagCell = tagRow.insertCell();
            field.tagCell = tagCell;
            tagCell.className = "field-tag";
            let tagDiv = document.createElement("div");
            tagCell.append(tagDiv);
            tagDiv.className = "field-tag";
            let tagSpan = document.createElement("span");
            tagDiv.append(tagSpan);
            tagSpan.tabIndex = 0; // makes the element focusable and tabbable
            field.tagSpan = tagSpan;
            //tagSpan.contentEditable = true;
            tagSpan.innerText = field.tag;

            // Indicators
            let ind1Cell = tagRow.insertCell();
            field.ind1Cell = ind1Cell;
            ind1Cell.classList.add("indicators");
            let ind1Div = document.createElement("div");
            ind1Cell.append(ind1Div);
            ind1Div.className = "indicators";
            let ind1Span = document.createElement("span");
            field.ind1Span = ind1Span;
            ind1Div.append(ind1Span);
            ind1Span.className = "mx-1";
            ind1Span.tabIndex = 0;
            
            let ind2Cell = tagRow.insertCell();
            field.ind2Cell = ind2Cell;
            ind2Cell.classList.add("indicators");
            let ind2Div = document.createElement("div");
            ind2Cell.append(ind2Div);
            ind2Div.className = "indicators";
            let ind2Span = document.createElement("span");
            field.ind2Span = ind2Span;
            ind2Div.append(ind2Span);
            ind2Span.className = "mx-1";
            ind2Span.tabIndex = 0;

            // Subfield table
            let fieldCell = field.row.insertCell();
            let subfieldTable = document.createElement("table");
            field.subfieldTable = subfieldTable;
            fieldCell.append(subfieldTable);
            subfieldTable.className = "marc-field";

            // Controlfield
            // no subfields
            if (field.constructor.name == "ControlField") {
                field.row.classList.add("hidden-field");
                let fieldRow = subfieldTable.insertRow();
                fieldRow.insertCell().className = "subfield-menu" // placeholder for subfield menu column
                fieldRow.insertCell().className = "subfield-code"; // placeholder for subfield code column
                let valCell = fieldRow.insertCell();
                valCell.innerHTML = field.value;
            } else {
                // indicators 
                for (let span of [ind1Span, ind2Span]) {
                    let indicator = span === ind1Span ? field.indicators[0] : field.indicators[1];
                    span.innerText = indicator;
                }

                for (let subfield of field.subfields) {
                    this.buildSubfieldRow(subfield);  
                }
            }

            if (!this.historyMode) {
                // Events
                field.row.addEventListener("click", function() {
                    component.fieldSelected(field)
                });

                // Menu add field
                addField.addEventListener("click", function() {
                    component.addField(jmarc)
                });

                // Menu delete field
                deleteField.addEventListener("click", function() {
                    component.deleteField(jmarc)
                });

                tagDiv.addEventListener("click", tagActivate);
                tagSpan.addEventListener("focus", tagActivate);
                tagSpan.addEventListener("blur", tagUpdate);
            }

            // Activate
            // call when user clicks or tabs into tag field
            function tagActivate() {
                component.fieldSelected(field);
                tagCell.classList.add("field-tag-selected");

                let popout = document.createElement("div");
                tagCell.append(popout);
                popout.className = "tag-input-popout";

                let input = document.createElement("input");
                popout.append(input);
                input.className = "tag-input";
                input.placeholder = tagSpan.innerText;
                input.maxLength = 3;
                input.focus();
                
                input.addEventListener("keydown", function(event) {
                    // return key
                    if (event.keyCode === 13) {
                        event.preventDefault();
                        input.blur();
                    }

                    // shift + tab
                    if (event.keyCode === 9 && component.shiftPressed) {
                        event.preventDefault();
                        input.blur();
                        menuButton.focus();
                    }
                });

                input.addEventListener("blur", function() {
                    tagSpan.innerText = input.value || tagSpan.innerText;
                    tagCell.classList.remove("field-tag-selected");
                    input.remove();
                    tagUpdate();
                });

                input.addEventListener("input",function(){
                    // adding the snapshot 
                    if (tagSpan.innerText.length === 3) {

                    }
                });
            }
            
            // Tag update actions
            // call when user changes the tag value
            function tagUpdate() {
                field.tag = tagSpan.innerText;

                // validations warnings
                component.validationWarnings(jmarc);
                
                field.tagSpan.classList.remove("invalid");
                field.tagSpan.classList.remove("unsaved");

                // record state
                component.checkSavedState(jmarc);

                // skip checks if whole record is saved
                if (jmarc.saved) {
                    return
                }

                if (! field.tagSpan.innerText.match(/[0-9A-Z]/)) {
                    field.tagSpan.classList.add("invalid");
                } else if (! field.savedState || field.compile().tag !== field.savedState.tag) {
                    field.tagSpan.classList.add("unsaved")
                } 

                for (let subfield of field.subfields) {
                    if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
                        component.setAuthControl(field, subfield, subfield.valueCell, subfield.valueSpan)
                    } else {
                        component.removeAuthControl(subfield);
                    }
                }
            }

            if (!this.historyMode) {
                // Indicator actions
                ind1Div.addEventListener("click", function() {indActivate(1)});
                ind1Span.addEventListener("focus", function() {indActivate(1)});
                ind1Span.addEventListener("blur", function() {indUpdate(1)});
                ind2Div.addEventListener("click", function() {indActivate(2);});
                ind2Span.addEventListener("focus", function() {indActivate(2)});
                ind2Span.addEventListener("blur", function() {indUpdate(2);});
            }

            function indActivate(ind) {
                let [cell, div, span] = [null, null, null];

                if (ind === 1) {
                    [cell, div, span] = [ind1Cell, ind1Div, ind1Span];
                } else if (ind === 2) {
                    [cell, div, span] = [ind2Cell, ind2Div, ind2Span];
                }

                let popout = document.createElement("div");
                cell.append(popout);
                cell.classList.add("ind-selected");
                popout.className = "ind-input-popout";

                let input = document.createElement("input");
                popout.append(input);
                input.className = "ind-input";
                input.placeholder = span.innerText;
                input.maxLength = 1;
                input.focus();

                input.addEventListener("keydown", function(event) {
                    // return key
                    if (event.keyCode === 13) {
                        event.preventDefault();
                        input.blur();
                    }

                    // shift + tab
                    if (event.keyCode === 9 && component.shiftPressed) {
                        event.preventDefault();
                        input.blur();
                        
                        if (ind === 1) {
                            tagSpan.focus();
                        } else {
                            ind1Span.focus();
                        }
                    }
                });

                input.addEventListener("blur", function() {
                    span.innerText = input.value || span.innerText;
                    cell.classList.remove("ind-selected");
                    input.remove();
                    indUpdate(ind);
                });

                input.addEventListener("input",function(){
                    // adding the snapshot 
                    if (tagSpan.innerText.length === 3) {
                        // todo: add detetction for indicators

                    }
                });
            }

            function indUpdate(ind) {
                let cell = ind === 1 ? ind1Cell : ind2Cell;
                let span = ind === 1 ? ind1Span : ind2Span;

                // convert empty strings to underscore
                span.innerText = ["", ""].includes(span.innerText) ? "_" : span.innerText;

                // copy the indicators array because updating it directly has strange side effects
                let updated = [field.indicators[0], field.indicators[1]]

                if (span == ind1Span) {
                    updated[0] = span.innerText;
                } else {
                    updated[1] = span.innerText;
                }

                // set to the updated array
                field.indicators = updated;

                // validation warnings
                component.validationWarnings(jmarc);

                // record state
                cell.classList.remove("invalid");
                cell.classList.remove("unsaved");
                component.checkSavedState(jmarc);

                // skip checks if whole record is saved
                if (jmarc.saved) {
                    return
                }

                if (! field.savedState || field.compile().indicators[ind-1] !== field.savedState.indicators[ind-1]) {
                    cell.classList.add("unsaved");
                }
            }
        
            for (let span of [ind1Span, ind2Span]) {
                span.addEventListener("input", function() {
                    if (span == ind1Span) {
                        indUpdate(1)
                    } else {
                        indUpdate(2)
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
            }

            return field
        },
        buildSubfieldRow(subfield, place) {
            let component = this;
            let field = subfield.parentField;
            let table = field.subfieldTable;
            let jmarc = field.parentRecord;
   
            // create the row
            subfield.row = table.insertRow(place);
            subfield.row.classList.add("subfield-row");

            // menu
            let menuCell = subfield.row.insertCell();
            let codeMenu = document.createElement("div");
            menuCell.append(codeMenu);
            codeMenu.className = "dropdown-menu subfield-menu";
            let menuButton = document.createElement("button");
            menuCell.append(menuButton);
            menuButton.classList = "fa fa-bars subfield-menu";
   
            // enable elems to toggle menu
            menuButton.setAttribute("data-toggle", "dropdown");

            // Subfield code
            let codeCell = subfield.row.insertCell();
            subfield.codeCell = codeCell;
            codeCell.className = "subfield-code";
            let codeDiv = document.createElement("div");
            codeCell.append(codeDiv);
            codeDiv.classList.add("subfield-code");
            let codeSpan = document.createElement("span");
            subfield.codeSpan = codeSpan;
            codeDiv.append(codeSpan);
            //codeSpan.contentEditable = true;
            codeSpan.innerText = subfield.code;
            codeSpan.tabIndex = 0;

            // add subfield
            let addSubfield = document.createElement("i");
            codeMenu.append(addSubfield);
            addSubfield.className = "dropdown-item";
            addSubfield.innerText = "Add subfield";
   
            // delete subfield
            let deleteSubfield = document.createElement("i");
            codeMenu.append(deleteSubfield);
            deleteSubfield.className = "dropdown-item";
            deleteSubfield.innerText = "Delete subfield";

            let moveSubfieldUp = document.createElement("i")
            codeMenu.append(moveSubfieldUp)
            moveSubfieldUp.className = "dropdown-item"
            moveSubfieldUp.innerText = "Move subfield up"

            let moveSubfieldDown = document.createElement("i")
            codeMenu.append(moveSubfieldDown)
            moveSubfieldDown.className = "dropdown-item"
            moveSubfieldDown.innerText = "Move subfield down"
   
            // Subfield value
            let valCell = subfield.row.insertCell();
            valCell.className = "subfield-value";
            valCell.setAttribute("data-taggle", "tooltip");
            //valCell.title = `Guidelines for ${field.tag}\$${subfield.code} (pending)`;
            valCell.innerText = " "; // space for padding
   
            let valSpan = document.createElement("span");
            valCell.appendChild(valSpan);
            valSpan.classList.add("subfield-value");

            subfield.valueCell = valCell;
            subfield.valueElement = subfield.valueSpan = valSpan; // save the value HTML element in the subfield object
            valSpan.innerText = subfield.value;
            valSpan.contentEditable = true;

            // create the last cell
            subfield.xrefCell = subfield.row.insertCell()
   
            // auth controlled
            if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
                this.setAuthControl(field, subfield)
            }

            if (!this.historyMode) {
                // Menu actions
                menuButton.addEventListener("focus", function() {
                    component.clearSelectedSubfield(jmarc);
                    subfield.selected = true;
                });

                // Add subfiueld
                addSubfield.addEventListener("click", function() {
                    component.addSubField(jmarc)
                });
                
                // Delete subfield
                deleteSubfield.addEventListener("click", function() {
                    component.deleteSubFieldFromShort(jmarc)
                });

                moveSubfieldUp.addEventListener("click", () => {
                    component.moveSubfield(jmarc, -1)        
                })

                moveSubfieldDown.addEventListener("click", () => {
                    component.moveSubfield(jmarc, 1)
                })
            }

            // Subfield code actions
            function subfieldCodeActivate() {
                component.clearSelectedSubfield(jmarc);
                subfield.selected = true;
                codeCell.classList.add("subfield-code-selected");

                let popout = document.createElement("div");
                codeCell.append(popout);
                popout.className = "subfield-code-input-popout";

                let input = document.createElement("input");
                popout.append(input);
                input.className = "subfield-code-input";
                input.placeholder = codeSpan.innerText;
                input.maxLength = 1;
                input.focus();
                
                input.addEventListener("keydown", function(event) {
                    // return key
                    if (event.keyCode === 13) {
                        event.preventDefault();
                        input.blur();
                    }

                    // shift + tab
                    if (event.keyCode === 9 && component.shiftPressed) {
                        event.preventDefault();
                        input.blur();
                        menuButton.focus();
                    }
                });

                input.addEventListener("blur", function() {
                    codeSpan.innerText = input.value || codeSpan.innerText;
                    codeCell.classList.remove("subfield-code-selected");
                    input.remove();
                    subfieldCodeUpdate();
                });

                input.addEventListener("input",function(){
                    // adding the snapshot 
 
                });
            }

            function subfieldCodeUpdate() {
                subfield.code = codeSpan.innerText || subfield.code;

                // auth control
                if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
                    component.setAuthControl(field, subfield)
                } else {
                    component.removeAuthControl(subfield)
                }

                subfield.codeSpan.classList.remove("invalid");
                subfield.codeSpan.classList.remove("unsaved");

                // validations
                component.validationWarnings(jmarc);

                // record state
                component.checkSavedState(jmarc);

                // skip state check if whole record is saved
                if (jmarc.saved) {
                    return
                }

                if (! subfield.savedState || subfield.compile().code !== subfield.savedState.code) {
                    subfield.codeSpan.classList.add("unsaved");
                }

                return
            }

            if (!this.historyMode) {
                codeDiv.addEventListener("click", subfieldCodeActivate);
                codeSpan.addEventListener("focus", subfieldCodeActivate);
                codeSpan.addEventListener("blur", subfieldCodeUpdate);

                // Subfield value actions
                valCell.addEventListener("click", function () {valSpan.focus()});
            }
            
            function updateSubfieldValue() {

                subfield.value = valSpan.innerText;

                valCell.classList.remove("unsaved");

                // validations
                component.validationWarnings(jmarc);

                // record state
                component.checkSavedState(jmarc);

                // skip check if whole record is saved
                if (jmarc.saved) {
                    return
                }

                // check state
                if (! subfield.savedState || subfield.savedState.value !== subfield.value) {
                    valCell.classList.add("unsaved");
                }

                return
            }

            if (!this.historyMode) {
                valSpan.addEventListener("focus", updateSubfieldValue); // allows triggering arbitrarily
                valCell.addEventListener("input", updateSubfieldValue);
                valCell.addEventListener("mousedown", updateSubfieldValue); // auth control selection
        

                // System paste
                valCell.addEventListener("paste", function (event) {
                    // strip the content of HTML tags
                    // https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event
                    event.preventDefault();
                    let paste = event.clipboardData.getData("text/plain");
                    // do the paste
                    let selection = window.getSelection();
                    if (!selection.rangeCount) return;
                    selection.deleteFromDocument();
                    selection.getRangeAt(0).insertNode(document.createTextNode(paste));

                    // strip newlines and multispaces
                    valSpan.innerText = valSpan.innerText.replace(/\r?\n|\r/g, " ");
                    valSpan.innerText = valSpan.innerText.replace(/ {2,}/g, " ");

                    // do the update and checks
                    updateSubfieldValue();
                });

                valSpan.addEventListener("focus", function() {
                    component.fieldSelected(field);
                    valSpan.classList.add("subfield-value-selected");
                    component.clearSelectedSubfield(jmarc);
                    subfield.selected = true;
                });

                valCell.addEventListener("click", function() {
                    valSpan.classList.add("subfield-value-selected");
                    component.clearSelectedSubfield(jmarc);
                    subfield.selected = true;
                });

                valSpan.addEventListener("blur", function() {
                    // remove extraneous whitespace
                    if (valSpan.innerText.match(/(^\s)|(\s$)|([\r\n])|(\s{2,})/)) {
                        valSpan.innerText = 
                            valSpan.innerText
                            .replace(/[\r\n]/g, ' ')
                            .trim()
                            .replace(/ {2,}/g, ' ');
                        
                        updateSubfieldValue();
                        
                        component.callChangeStyling(
                            `Extraneous whitespace removed from ${field.tag}$${subfield.code}`,
                            "d-flex w-100 alert-success"
                        )
                    }

                    valSpan.classList.remove("subfield-value-selected");
                    component.clearSelectedSubfield(jmarc);
                    subfield.selected = false;
                });

                valSpan.addEventListener("keydown", function (event) {
                    // prevent newline and blur on return key
                    if (event.keyCode === 13) {
                        event.preventDefault();
                        valSpan.blur();
                    }

                    // arrow keys
                    if (event.keyCode === 38) {
                        // up
                        if (field.subfields.indexOf(subfield) === 0) {
                            // first subfield
                            let i = jmarc.fields.indexOf(field) - 1; 
                            let f = jmarc.fields[i];

                            while(f.row.classList.contains("hidden-field")) {
                                i--;
                                f = jmarc.fields[i]
                            }

                            f.subfields[f.subfields.length-1].valueSpan.focus();
                            component.fieldSelected(f);
                        } else {
                            let i = field.subfields.indexOf(subfield) - 1;
                            valSpan.blur();
                            field.subfields[i].valueSpan.focus();
                        }
                    }

                    if (event.keyCode === 40) {
                        // down
                        if (field.subfields.indexOf(subfield) === field.subfields.length - 1) {
                            // last subfield
                            let i = jmarc.fields.indexOf(field) + 1;
                            let f = jmarc.fields[i];

                            while(f.row.classList.contains("hidden-field")) {
                                i++;
                                f = jmarc.fields[i]
                            }

                            f.subfields[0].valueSpan.focus();
                            component.fieldSelected(f);  
                        } else {
                            let i = field.subfields.indexOf(subfield) + 1;
                            valSpan.blur();
                            field.subfields[i].valueSpan.focus();
                        }
                    }
                });

                valSpan.addEventListener("input", function () {
                    // select the record receiving the click
                    component.selectRecord(jmarc)

                    return // disable automatic checkbox click and copy field on input

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
            }

            const observer = new MutationObserver(function() {
                console.log('callback that runs when observer is triggered');
            });

            observer.observe(valSpan, {subtree: true, childList: true});
   
            return subfield
        },
        setAuthControl(field, subfield) {
            let component = this;
            subfield.valueSpan.classList.add("authority-controlled");
   
            if (! "xref" in subfield) {
                subfield.valueSpan.classList.add("authority-controlled-unmatched")
            }
 
            if (subfield.xrefCell.children.length === 0) {
                if (subfield.xref) {
                    // exisiting field
                    let xrefLink = document.createElement("a");
                    subfield.xrefCell.appendChild(xrefLink);
                    xrefLink.href = component.baseUrl + `records/auths/${subfield.xref}`;
                    xrefLink.target="_blank";
     
                    let xrefIcon = document.createElement("i");
                    xrefIcon.className = "fas fa-link float-left mr-2";
                    xrefLink.appendChild(xrefIcon);
                } else {
                    let addButton = document.createElement("i");
                    addButton.title = "Create new authority from this value";
                    addButton.className = "fas fa-solid fa-plus float-left mr-2 create-authority";
                    subfield.xrefCell.append(addButton);
                }
            }

            subfield.valueSpan.addEventListener("dblclick", function() {
                // open the linked auth
                if (subfield.xref) {
                    open(component.baseUrl + `records/auths/${subfield.xref}`);
                }
            });
     
            // lookup
            subfield.valueCell.eventParams = [component, subfield];
            if (!this.historyMode) {
                subfield.valueCell.addEventListener("keyup", keyupAuthLookup);
            }
        },
        removeAuthControl(subfield) {
            if (subfield.xrefCell) {
                delete subfield.xref;
                subfield.xrefCell.innerHTML = "";
            }
   
            subfield.valueSpan.classList.remove("authority-controlled");
            subfield.valueSpan.classList.remove("authority-controlled-unmatched");
            subfield.valueCell.removeEventListener("keyup", keyupAuthLookup);
        },
        fieldSelected(field) {
            for (let f of field.parentRecord.fields) {
                f.row.classList.remove("field-row-selected");
                f.selected = false;
            }

            field.row.classList.add("field-row-selected");
            field.selected = true;

            return field
        },
        clearSelectedSubfield(jmarc) {
            for (let field of jmarc.getDataFields()) {
                for (let subfield of field.subfields) {
                    subfield.selected = false
                }
            }
        },
        checkSavedState(jmarc) {
            if (! jmarc.saveButton) {
                // jmarc is probably read-only
                return
            }

            if (jmarc.saved) {
                jmarc.saveButton.classList.remove("text-danger");
                jmarc.saveButton.title = "No Unsaved Changes";
            } else {
                jmarc.saveButton.classList.add("text-danger");
                jmarc.saveButton.title = "Save Record";
            }
        },
        validationWarnings(jmarc) {
            jmarc.getDataFields().forEach(field => {
                field.tagCell.classList.remove("validation-flag");
                field.ind1Cell.classList.remove("validation-flag");
                field.ind2Cell.classList.remove("validation-flag");
                field.tagCell.classList.title = field.ind1Cell.classList.title = field.ind2Cell.title = "";

                let flags = field.validationWarnings().filter(x => x instanceof TagValidationFlag);

                if (flags.length > 0) {
                    field.tagCell.classList.add("validation-flag");
                    field.tagCell.title = flags.map(x => x.message).join("\n");
                }

                flags = field.validationWarnings().filter(x => x instanceof Indicator1ValidationFlag);

                if (flags.length > 0) {
                    field.ind1Cell.classList.add("validation-flag");
                    field.ind1Cell.title = flags.map(x => x.message).join("\n");
                }

                flags = field.validationWarnings().filter(x => x instanceof Indicator2ValidationFlag);

                if (flags.length > 0) {
                    field.ind2Cell.classList.add("validation-flag");
                    field.ind2Cell.title = flags.map(x => x.message).join("\n");
                }

                field.subfields.forEach(subfield => {
                    subfield.codeCell.classList.remove("validation-flag");
                    subfield.valueSpan.classList.remove("validation-flag");
                    subfield.codeCell.title = subfield.valueSpan.title = "";

                    let flags = subfield.validationWarnings().filter(x => x instanceof SubfieldCodeValidationFlag);

                    if (flags.length > 0) {
                        subfield.codeCell.classList.add("validation-flag");
                        subfield.codeCell.title = flags.map(x => x.message).join("\n");
                    }

                    flags = subfield.validationWarnings().filter(x => x instanceof SubfieldValueValidationFlag);

                    if (flags.length > 0) {
                        subfield.valueSpan.classList.add("validation-flag");
                        subfield.valueSpan.title = flags.map(x => x.message).join("\n");
                    }
                })
            })
        }
    },
    components: {
        'countcomponent': countcomponent
    }
}

function selectAuthority(component, subfield, choice) {
//    let component = event.currentTarget.eventParams[0];
//    let subfield = event.currentTarget.eventParams[1];
    let field = subfield.parentField;
    let jmarc = field.parentRecord;

    if (field.tag === "991") {
        // only carry over indicators for 991
        field.ind1Span.innerText = choice.indicators[0];
        field.ind2Span.innerText = choice.indicators[1];
        field.indicators = choice.indicators.map(x => x === " " ? "_" : x);
    }

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
            component.buildSubfieldRow(newSubfield, place);
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

    // trigger unsaved changes detection and update events
    field.ind1Span.focus();
    field.ind2Span.focus();
    field.subfields.forEach(x => {x.codeSpan.focus(); x.valueSpan.focus()});
    subfield.valueSpan.focus();
    subfield.valueSpan.blur();

    return
}

// auth-controlled field keyup event function
function keyupAuthLookup(event) {
    //target: subfield value cell
    let component = event.currentTarget.eventParams[0];
    let subfield = event.currentTarget.eventParams[1];
    let field = subfield.parentField;
    let jmarc = field.parentRecord;

   
    if (event.keyCode < 45 && event.keyCode !== 8 && event.keyCode !== 13) {
        // non ascii or delete keys
        
        return
    }
 
    subfield.valueSpan.classList.add("authority-controlled-unmatched");
    
    // authority creation button
    subfield.xrefCell.innerHTML = null;
    let addButton = document.createElement("i");
    subfield.xrefCell.append(addButton);
    addButton.title = "Create new authority from this value";
    addButton.className = "fas fa-solid fa-plus float-left mr-2 create-authority";

    addButton.addEventListener("click", async function() {
        subfield.xrefCell.innerHTML = null;
        let spinner = document.createElement("i");
        spinner.className = "fa fa-spinner";
        subfield.xrefCell.append(spinner);

        // create and save the new authority record
        let tag = jmarc.authMap[field.tag][subfield.code];
        let auth = new Jmarc("auths");
        
        // add all auth-controlled subfields from the field
        let newField = auth.createField(tag); // .createSubfield(subfield.code).value = subfield.value;
        
        for (let s of field.subfields.filter(x => jmarc.isAuthorityControlled(field.tag, x.code))) {
            newField.createSubfield(s.code).value = s.value
        }

        newField = auth.createField("040", "a");
        let newSubfield = newField.createSubfield("a");

        if (jmarc.getField("040")) {
            if (jmarc.getField("040").getSubfield("a")) {
                newSubfield.value = jmarc.getField("040").getSubfield("a").value
            }
        } else {
            newSubfield.value = "." // record can't be saved with blank value
        }

        newField.createSubfield("b").value = "eng";
        newField.createSubfield("f").value = "unbisn";
        
        if (jmarc.getField("191")) {
            if (jmarc.getField("191").getSubfield("a")) {
                newSubfield = auth.createField("670").createSubfield("a");
                newSubfield.value = jmarc.getField("191").getSubfield("a").value
            }
        } else if (jmarc.getField("791")) {
            if (jmarc.getField("791").getSubfield("a")) {
                newSubfield = auth.createField("670").createSubfield("a");
                newSubfield.value = jmarc.getField("791").getSubfield("a").value;
            }
        }

        if (await auth.authHeadingInUse()) {
            let headingField = auth.fields.filter(x => x.tag.match(/^1/))[0];
            let headingString = headingField.subfields.map(x => x.value).join(" ");
            component.callChangeStyling(`Auth heading "${headingString}" in field ${field.tag} is already in use`, "d-flex w-100 alert-danger");
            subfield.xrefCell.removeChild(spinner);
            subfield.xrefCell.append(addButton);
            return
        }

        auth.post().then(
            auth => {
                // update all auth-ctrled subfields
                for (let s of field.subfields.filter(x => jmarc.isAuthorityControlled(field.tag, x.code))) {
                    s.xref = auth.recordId;
                    s.valueSpan.classList.remove("authority-controlled-unmatched");
                    s.xrefCell.innerHTML = null;

                    // create the xref link
                    let xrefLink = document.createElement("a");
                    s.xrefCell.appendChild(xrefLink);
                    xrefLink.href = component.baseUrl + `records/auths/${auth.recordId}`;
                    xrefLink.target="_blank";
     
                    let xrefIcon = document.createElement("i");
                    xrefIcon.className = "fas fa-link float-left mr-2";
                    xrefLink.appendChild(xrefIcon);
                }

                component.callChangeStyling(`New authority record #${auth.recordId} created`, "d-flex w-100 alert-success");
            }
        )
    });
 
    let dropdown = document.getElementById("typeahead-dropdown");
    dropdown && dropdown.remove();
 
    clearTimeout(subfield.timer);
    subfield.value = subfield.valueSpan.innerText;
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
                    subfield.valueCell.blur()
                    
                    let selectorDiv = document.createElement("div");
                    dropdown.append(selectorDiv);
                    selectorDiv.className = "typeahead-select";

                    let list = document.createElement("select"); // the select value is in target.value
                    selectorDiv.appendChild(list);
                    if (choices.length === 1) {
                        list.size = 2
                    } else {
                        list.size = choices.length;
                    }
                     // doesn't build correctly when there is only one choice
                    list.className = "list-group";
                    // list.focus() // disabled because we still want the field to be typeable when the dropdown appears
                    
                    // navigate into dropdown choices with down arrow key
                    // should it be with return instead?
                    subfield.valueSpan.addEventListener("keydown", (event) => {
                        if (event.keyCode === 40) {
                            // down arrow key
                            list.focus(); // list now navigable by default <select> behavior
                            list.firstChild.selected = true; // jump to to first choice
                        }
                    });

                    // populate the options
                    for (let choice of choices) {
                        let item = document.createElement("option");
                        list.appendChild(item);
                        item.className = "list-group-item";
                        item.value = JSON.stringify(choice.compile()); // option value has to be a string?
                       
                        item.innerHTML = choice.subfields.map(x => `<span class="lookup-choice-code">$${x.code}</span>&nbsp;<span class="lookup-choice-value">${x.value}</span>`).join("<br>");
                       
                        item.addEventListener("mouseover", function () {
                            item.classList.add("lookup-choice");
                        });
                       
                        item.addEventListener("mouseout", function () {
                            item.classList.remove("lookup-choice");
                            subfield.value = subfield.valueSpan.innerText;
                        });
                       
                        item.addEventListener("mousedown", function () {
                            selectAuthority(component, subfield, choice);
                            dropdown.remove();
                        });    
                    }

                    // keyboard navigation
                    list.addEventListener("keyup", (event) => { // only "keyup" works here?
                        if (event.keyCode === 13) {
                            // return key 
                            event.stopPropagation();

                            for (let choice of choices) {
                                if (event.target.value == JSON.stringify(choice.compile())) {
                                    selectAuthority(component, subfield, choice);
                                    dropdown.remove();
                                }
                            }
                        }
                    });
                });
            },
            750
        );
    }
}
