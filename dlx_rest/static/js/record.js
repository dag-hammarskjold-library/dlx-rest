  
let recup=""
/////////////////////////////////////////////////////////////////
// IMPORT
/////////////////////////////////////////////////////////////////

import { Jmarc } from "./jmarc.mjs";
import user from "./api/user.js";
import basket from "./api/basket.js";

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
        }
    },
    template: ` 
        <div class="container col-sm-10" id="app1" style="background-color:white;">
            <div class='mt-3 shadow' style="overflow-y: scroll; height:650px;">
                <div v-show="this.isRecordOneDisplayed==false && this.isRecordTwoDisplayed==false" mt-5>
                    <div class="ml-3 mr-3 jumbotron jumbotron-fluid">
                        <div class="container">
                            <h1 class="display-4 text-center">No record selected</h1>
                            <p class="lead text-center">You can select one from the basket to the left or create one via the menu above.</p>
                        </div>
                    </div>                                
                </div>
                <div id="records" class="row ml-3">
                    <div id="record1" v-show="this.isRecordOneDisplayed" class="col-sm-6 mt-1" style="border-left: 5px solid green;border-radius: 5px;">
                        <!-- <div>
                            <button v-if="readonly" id="remove1" type="button" class="btn btn-outline-success mb-2" style="display:none" v-on:click="removeRecordFromEditor('record1')">Remove this record</button>
                            <button v-else id="remove1" type="button" class="btn btn-outline-success mb-2" v-on:click="removeRecordFromEditor('record1')">Remove this record</button>
                        </div> -->
                    </div>
                    <div id="record2" v-show="this.isRecordTwoDisplayed" class="col-sm-6 mt-1" style="border-left: 5px solid green;border-radius: 5px;">
                        <!-- <div>
                            <button v-if="readonly" id="remove2" type="button" class="btn btn-outline-success mb-2" style="display:none" v-on:click="removeRecordFromEditor('record2')">Remove this record</button>
                            <button v-else id="remove2" type="button" class="btn btn-outline-success mb-2" v-on:click="removeRecordFromEditor('record2')">Remove this record</button>
                        </div> -->
                    </div>
                </div>
            </div>
        </div>
    `,
    data: function () {
        return {
            visible: true,
            record1: "",
            record2: "",
            collectionRecord1:"",
            collectionRecord2:"",
            isRecordOneDisplayed: false,
            isRecordTwoDisplayed: false,
            listElemToCopy:[],
            elementToCopy:{
                collection:"",
                recordIdToCopy:"",
                fieldToCopy:""
            },
            id: "",
            user: null,
            myBasket: null,
            targetedTable:""
        }
    },
    created: async function() {
        Jmarc.apiUrl = this.prefix;
        this.baseUrl = this.prefix.replace("/api", "");
        
        this.copiedFields = [];
        this.$root.$refs.multiplemarcrecordcomponent = this;

        let myProfile = await user.getProfile(this.prefix, 'my_profile');
        if (myProfile) {
            this.user = myProfile.data.email;
            this.myBasket = await basket.getBasket(this.prefix);
        }
        
        if (this.records !== "None") {
            this.records.split(",").forEach(
                record => {
                    var split_rec = record.split("/")
                    
                    if (split_rec.length === 2) {
                        Jmarc.get(split_rec[0], split_rec[1]).then(jmarc => {
                            if (this.readonly) {
                                this.displayMarcRecord(jmarc, true);
                            } else {
                                this.displayMarcRecord(jmarc, false); // record ID and collection
                            }
                        })
                        
                    } else {
                        let jmarc = new Jmarc(split_rec[0]);
                        if (split_rec[0] == "bibs") {
                            jmarc.createField('245').createSubfield('a').value = "insert new subfield value";
                        } else if (split_rec[0] == "auths") {
                            jmarc.createField('100').createSubfield('a').value = "insert new subfield value";
                        }
                        this.displayMarcRecord(jmarc, false);
                    }
                }
            );
            
            //recup = this
        } else if (this.workform !== 'None') {
            let wfCollection = this.workform.split('/')[0];
            let wfRecordId = this.workform.split('/')[1];
            let jmarc = await Jmarc.fromWorkform(wfCollection, wfRecordId);
            this.displayMarcRecord(jmarc, false);
        } 
        recup=this
    },
    methods: {

        // Record Control functions
        saveRecord(jmarc) {
            
        },

        cloneRecord() {

        },

        pasteFields() {

        },

        deleteRecord() {

        },

        saveToWorkform() {

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

        clearItemsToPast(){
            this.listElemToCopy=[]
        },

        pasteItems(record1,record2){

        },
        // clear all the checkbox selected
        clearCheck(recordID){

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
            //this.getIdFromRecordId(recId, coll)
            //this.$root.$refs.basketcomponent.removeRecordFromList(this.id, false)
            basketcomponent.removeRecordFromList(recId, coll)
            basket.deleteItem(this.prefix, 'userprofile/my_profile/basket', this.myBasket, coll, recId).then( () => {
                return true;
            })

        },
        removeRecordFromEditor(divID) {
            /* To do: update the location bar/route to indicate the presence/order of record collection/id pairs */
            // get the parent
            
            if (divID === "record1") {
                // remove the div
                let myDiv = document.getElementById("record1")
                //myDiv.children[1].remove()
                // reset the parameters
                this.record1 = ""
                this.isRecordOneDisplayed = false
                this.collectionRecord1=""
                this.callChangeStyling("Record removed from the editor", "row alert alert-success")
            } 
            else if (divID === "record2") {
                let myDiv = document.getElementById("record2")
                // remove the div
                //myDiv.children[1].remove()
                // reset the parameters
                this.record2 = ""
                this.isRecordTwoDisplayed = false
                this.collectionRecord2=""
                this.callChangeStyling("Record removed from the editor", "row alert alert-success")
            } else {
                 // replace record?
            }
            

            // optimize the display
            this.optimizeEditorDisplay(this.targetedTable)
            this.targetedTable=""
        },
        displayMarcRecord(jmarc, readOnly) {
            // Add to div
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
            
            jmarc.div = document.getElementById(myDivId);
            let table = this.buildRecordTable(jmarc, readOnly);
            jmarc.div.appendChild(table);    

            //////////////////////////////////////////////////////////////////////////////
            // optimize the display just when you have one record displayed
            //////////////////////////////////////////////////////////////////////////////

            this.targetedTable=table
            this.optimizeEditorDisplay(table)
        },
        buildRecordTable(jmarc, readOnly) {
            let table = document.createElement("table");
            jmarc.table = table;

            window.addEventListener("click",  function() {
                let dropdown = document.getElementById("typeahead-dropdown")
                dropdown && dropdown.remove();
            });
            
            // record.css
            table.className = jmarc.collection === "bibs" ? "bib" : "auth"; 
            table.className += " marc-record table-hover";
          
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
                    jmarc.saveButton.classList.add("text-primary");
                    jmarc.saveButton.title = "no new changes";
                } else {
                    jmarc.saveButton.classList.add("text-danger");
                    jmarc.saveButton.classList.remove("text-primary");
                    jmarc.saveButton.title = "save";
                }
            });
            
            return table       
        },
        buildTableHeader(jmarc) {
            let table = jmarc.table;
            
            // Table header
            let tableHeader = table.createTHead();
            jmarc.tableHEader = tableHeader;
            //let controlRow = tableHeader.insertRow();
            

            let idRow = tableHeader.insertRow();
            let idCell = idRow.insertCell();
            idCell.colSpan = 3;
            
            ///////////////////////////////////////////////////////////////////
            // Add the icon to remove the record displayed
            ///////////////////////////////////////////////////////////////////
            
            let removeRecordIcon= document.createElement("i");
            idCell.appendChild(removeRecordIcon);
            removeRecordIcon.type = "button";
            removeRecordIcon.value = "remove";
            removeRecordIcon.className = "fas fa-window-close text-warning float-left ml-1 mt-1"
            removeRecordIcon.title = "remove record";
            // transfert the pointer
            let that=this;
            // remove the record displayed
            removeRecordIcon.addEventListener("click",function(){
                that.removeRecordFromEditor(jmarc.div.id)
                table.parentNode.removeChild(table);
            });

            // Display Collection/RecordId
            let idField = document.createElement("h5");
            idCell.appendChild(idField);
            if (jmarc.workformName) {
                idField.innerText = `${jmarc.collection}/workforms/${jmarc.workformName}`;
            } else {
                let recordId = jmarc.recordId ? jmarc.recordId : "<New Record>"
                idField.innerText = `${jmarc.collection}/${recordId}`;
            }
            
            idField.className = "float-left mx-2";

            // This could be offloaded to config
            let controls = [
                {"name": "saveButton", "class": "fas fa-save text-primary", "title": "Save Record", "click": this.saveRecord(jmarc)},
                {"name": "cloneButton", "class": "fas fa-copy text-warning", "title": "Clone Record", "click": this.cloneRecord() },
                {"name": "pasteButton", "class": "far fa-arrow-alt-circle-down text-warning", "title": "Paste Fields", "click": this.pasteFields()  },
                {"name": "saveAsButton", "class": "fas fa-share-square text-primary", "title": "Save As Workform" ,"click": this.saveToWorkform() },
                {"name": "deleteButton", "class": "fas fa-trash text-danger", "title": "Delete Record",  "click": this.deleteRecord() }
            ];
            if (jmarc.workformName) {
                controls = [
                    {"name": "saveButton", "class": "fas fa-save text-primary", "title": "Save Workform", "click": this.saveRecord()},
                    //{"name": "cloneButton", "class": "fas fa-copy text-warning", "title": "Save " },
                    {"name": "pasteButton", "class": "far fa-arrow-alt-circle-down text-warning", "title": "Paste Fields", "click": this.pasteFields() },
                    {"name": "saveAsButton", "class": "fas fa-share-square text-primary", "title": "Save As Record", "click": this.cloneRecord()},
                    {"name": "deleteButton", "class": "fas fa-trash text-danger", "title": "Delete Workform", "click": this.deleteRecord()}
                ]
            }
            for (let control of controls) {
                let controlButton = document.createElement("i");
                idCell.appendChild(controlButton)
                controlButton.id = control;
                controlButton.className = `${control["class"]} float-left mx-1 my-2 record-control`;
                controlButton.title = control["title"];
                controlButton.onclick = control["click"];
                jmarc[control] = controlButton;
            }
            
            // Toggle hidden fields button?
            let toggleButton = document.createElement("i");
            idCell.appendChild(toggleButton);
            toggleButton.type = "button";
            toggleButton.value = "toggle";
            toggleButton.className = "fas fa-solid fa-eye";
            toggleButton.title = "toggle hidden fields";
            
            toggleButton.addEventListener("click", function() {
                for (let field of jmarc.fields) {
                    if (field.row.classList.contains("hidden-field")) {
                        field.row.classList.remove("hidden-field")
                        field.wasHidden = true;
                    }
                    else if (field.wasHidden) {
                        field.row.classList.add("hidden-field")
                    }
                }
            });
            
            // Delete button
            let deleteCell = idRow.insertCell();
            let deleteDiv = document.createElement("div");
            deleteCell.appendChild(deleteDiv);
            deleteDiv.className = "dropdown";
            
            let deleteButton = document.createElement("i");
            deleteDiv.appendChild(deleteButton);
            deleteButton.id = "deleteDropdown";
            deleteButton.type = "button";
            deleteButton.value = "delete";
            deleteButton.className = "fas fa-trash-alt text-danger dropdown-toggle mr-2 record-control";
            deleteButton.setAttribute("data-toggle", "dropdown");
            
            let deleteDropdown = document.createElement("div");
            deleteDiv.appendChild(deleteDropdown);
            deleteDropdown.className = "dropdown-menu";
            deleteDropdown.setAttribute("aria-labelledBy", "deleteDropdown");
            
            let deleteItem = document.createElement("a");
            deleteDropdown.appendChild(deleteItem);
            deleteItem.className = "dropdown-item";
            deleteItem.innerText = "Delete Record";
            deleteItem.href="#";
            
            if (jmarc.workformName) {
                closeButton.title = "Close Workform";
            } else {
                closeButton.title = "Close Record";
            }
            closeButton.onclick = () => {
                this.removeRecordFromEditor(jmarc.div.id)
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
    
            field.row = jmarc.tableBody.insertRow(place);
    
            // add the checkboxes
            let checkCell = field.row.insertCell();
            checkCell.className = "field-checkbox";
            let inputCheckboxCell = document.createElement("input");
            inputCheckboxCell.className = "field-checkbox";
            inputCheckboxCell.setAttribute("type","checkbox")
            checkCell.appendChild(inputCheckboxCell)
    
            // the instance of the calling object
            let that = component;

            // define the on click event
            checkCell.addEventListener('click', (e)=> {
                // check if the box is checked
                if (e.target.checked === true){
            
            
                    component.copiedFields.push(field);
                } else {
                   if (component.copiedFields) {
                       // remove from the list of copied fields
                       component.copiedFields.splice(component.copiedFields.indexOf(field, 1))
                   }
                }    
            });

            // Tag cell
            let tagCell = field.row.insertCell();
            field.tagCell = tagCell;
            tagCell.className = "field-tag badge badge-pill badge-warning dropdown-toggle";
    
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
                jmarc.saveButton.classList.remove("text-primary");
                jmarc.saveButton.title = "save";

                return
            });
    
            // menu item delete field
            let deleteField = document.createElement("i");
            tagMenu.append(deleteField);
            deleteField.className = "dropdown-item";
            deleteField.innerText = "Delete field";
    
            deleteField.addEventListener("click", function() {
                jmarc.deleteField(field);
                table.deleteRow(field.row.rowIndex);

                if (jmarc.saved) {
                    jmarc.saveButton.classList.remove("text-danger");
                    jmarc.saveButton.classList.add("text-primary");
                    jmarc.saveButton.title = "no new changes";
                } else {
                    jmarc.saveButton.classList.add("text-danger");
                    jmarc.saveButton.classList.remove("text-primary");
                    jmarc.saveButton.title = "save";
                }

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
                    //tagSpan.innerText = ''
                    event.preventDefault()
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
    
            // Indicators
            if (! field.tag.match(/^00/)) {
                let ind1Span = document.createElement("span");
                tagCell.append(ind1Span);
        
                let ind2Span = document.createElement("span");
                tagCell.append(ind2Span);
        
                for (let span of [ind1Span, ind2Span]) {
                    let indicator = span === ind1Span ? field.indicators[0] : field.indicators[1];
                    span.className = "mx-1 text-secondary"
                    span.innerText = indicator;
                    span.contentEditable = true;
        
                    span.addEventListener("input", function() {
                        if (span.innerText.length > 1) {    
                            span.innerText = span.innerText.substring(0, 1);
                        }
            
                        if (span == ind1Span) {
                            field.indicators[0] = span.innerText;
                        } else {
                            field.indicators[1] = span.innerText;
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
            
            // "coded" fields
            //if (field.tag.match(/^0/)) {
            //    field.row.classList.add("hidden-field");
            //}
            
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
            codeCell.className = "subfield-code badge badge-pill bg-primary text-light dropdown-toggle";
    
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
                    jmarc.saveButton.classList.add("text-primary");
                    jmarc.saveButton.title = "no new changes";
                } else {
                    jmarc.saveButton.classList.add("text-danger");
                    jmarc.saveButton.classList.remove("text-primary");
                    jmarc.saveButton.title = "save";
                }

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

            valCell.addEventListener("input", function () {
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
            });
    
            valSpan.addEventListener("keydown", function (event) {
                // prevent newline and blur on return key
                if (event.keyCode === 13) {
                    event.preventDefault();
                    valSpan.blur();
                }
            });
    
            codeSpan.addEventListener("input", function() {
                if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
                    component.setAuthControl(field, subfield)
                } else {
                    component.removeAuthControl(subfield)
                }
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
