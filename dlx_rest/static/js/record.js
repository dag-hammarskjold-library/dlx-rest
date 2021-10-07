  
let recup=""
/////////////////////////////////////////////////////////////////
// IMPORT
/////////////////////////////////////////////////////////////////

import { Jmarc } from "./jmarc.js";
import user from "./api/user.js";
import basket_api from "./api/basket_api.js";
import workform_api from "./api/workform_api.js";

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
                        <div>
                            <button v-if="readonly" id="remove1" type="button" class="btn btn-outline-success" style="display:none" v-on:click="removeRecordFromEditor('record1')">Remove this record</button>
                            <button v-else id="remove1" type="button" class="btn btn-outline-success" v-on:click="removeRecordFromEditor('record1')">Remove this record</button>
                        </div>
                    </div>
                    <div id="record2" v-show="this.isRecordTwoDisplayed" class="col-sm-6 mt-1" style="border-left: 5px solid green;border-radius: 5px;">
                        <div>
                            <button v-if="readonly" id="remove2" type="button" class="btn btn-outline-success" style="display:none" v-on:click="removeRecordFromEditor('record2')">Remove this record</button>
                            <button v-else id="remove2" type="button" class="btn btn-outline-success" v-on:click="removeRecordFromEditor('record2')">Remove this record</button>
                        </div>
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
            id: "",
            user: null,
        }
    },
    created: async function() {
        Jmarc.apiUrl = this.prefix;
        this.$root.$refs.multiplemarcrecordcomponent = this;

        let myProfile = await user.getProfile(this.prefix, 'my_profile');
        if (myProfile) {
            this.user = myProfile.data.email;
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
            
            recup = this
        } else if (this.workform !== 'None') {
            let wfCollection = this.workform.split('/')[0];
            let wfRecordId = this.workform.split('/')[1];
            workform_api.getWorkform(this.prefix, wfCollection, wfRecordId).then(jmarc => {
                this.displayMarcRecord(jmarc, false);
            });
        } 


    },
    methods: {
        justatest(){
            alert("just a test")
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
        removeFromBasket(recId, coll) {
            this.getIdFromRecordId(recId, coll)
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
                this.collectionRecord1=""
                this.callChangeStyling("Record removed from the editor", "row alert alert-success")
            }
            if (recordID === "record2") {
                let myDiv = document.getElementById("record2")
                // remove the div
                myDiv.children[1].remove()
                // reset the parameters
                this.record2 = ""
                this.isRecordTwoDisplayed = false
                this.collectionRecord2=""
                this.callChangeStyling("Record removed from the editor", "row alert alert-success")
            }
        },
        displayMarcRecord(jmarc, readOnly) {
            // Add to div
            let myDivId;
            
            if (this.isRecordOneDisplayed == false) {
                myDivId = "record1";
                this.isRecordOneDisplayed = true
                this.record1 = jmarc.recordId;
                this.collectionRecord1 = jmarc.collection; // used for auth merge
            }
            else if (this.isRecordTwoDisplayed == false) {
                myDivId = "record2";
                this.isRecordTwoDisplayed = true
                this.record2 = jmarc.recordId;
                this.collectionRecord2 = jmarc.collection; // used for auth merge
            }
            
            jmarc.div = document.getElementById(myDivId);
            let table = this.buildRecordTable(jmarc, readOnly);
            jmarc.div.appendChild(table);    
        },
        buildRecordTable(jmarc, readOnly) {
            let component = this; // for use in event listeners 
            let table = document.createElement("table");
            
            window.addEventListener("click",  function() {
                let dropdown = document.getElementById("typeahead-dropdown")
                dropdown && dropdown.remove();
            });
            
            // table css in in base1.html
            table.className = jmarc.collection === "bibs" ? "bib" : "auth"; 
            table.className += " marc-record table-hover";
          
            if (readOnly || jmarc.readOnly) {
                table.className += " read-only"
            }
            
            // Table header
            let tableHeader = table.createTHead();
            let idRow = tableHeader.insertRow();
            let idCell = idRow.insertCell();
            idCell.colSpan = 3;
            
            let idField = document.createElement("h5");
            idCell.appendChild(idField);
            if (jmarc.recordId) {
                idField.innerText = `${jmarc.collection}/${jmarc.recordId}`;
            } else {
                idField.innerText = `New ${jmarc.collection} record`;
            }
            idField.className = "float-left mx-2";
            
            // Save Button
            let saveDiv = document.createElement("div");
            idCell.appendChild(saveDiv);
            saveDiv.className = "dropdown";
            let saveButton = document.createElement("i");
            saveDiv.appendChild(saveButton);
            saveButton.type = "button";
            saveButton.value = "save";
            saveButton.className = "fas fa-save text-primary float-left mr-2 mt-1 record-control";
            saveButton.setAttribute("data-toggle", "dropdown");

            let saveDropdown = document.createElement("div");
            saveDiv.appendChild(saveDropdown);
            saveDropdown.className = "dropdown-menu";
            saveDropdown.setAttribute("aria-labelledBy", "saveDropdown");
            
            let saveItem = document.createElement("a");
            saveDropdown.appendChild(saveItem);
            saveItem.className = "dropdown-item";
            saveItem.innerText = "Save Record";
            saveItem.href="#";

            saveItem.onclick = () => {
                let promise = jmarc.recordId === null ? jmarc.post() : jmarc.put();
                
                promise.then(
                    jmarc => {
                        this.removeRecordFromEditor(jmarc.div.id); // div element is stored as a property of the jmarc object
                        this.displayMarcRecord(jmarc, false);
                        this.callChangeStyling("Record " + jmarc.recordId + " has been updated/saved", "row alert alert-success")
                    }
                ).catch(
                    error => {
                        this.callChangeStyling(error.message,"row alert alert-danger")
                    }
                );
            };

            let saveWorkformItem = document.createElement("a");
            saveDropdown.appendChild(saveWorkformItem);
            saveWorkformItem.className = "dropdown-item";
            saveWorkformItem.innerText = "Save as workform";
            saveWorkformItem.href="#";

            saveWorkformItem.onclick = () => {
                let promise = jmarc.recordId === null ? jmarc.post() : jmarc.put();
                
                promise.then(
                    jmarc => {
                        this.removeRecordFromEditor(jmarc.div.id); // div element is stored as a property of the jmarc object
                        this.displayMarcRecord(jmarc, false);
                        this.callChangeStyling("Record " + jmarc.recordId + " has been updated/saved", "row alert alert-success")
                    }
                ).catch(
                    error => {
                        this.callChangeStyling(error.message,"row alert alert-danger")
                    }
                );
            };

            
                    
            // clone record  
            let cloneButton = document.createElement("i");
            idCell.appendChild(cloneButton);
            cloneButton.type = "button";
            cloneButton.value = "clone";
            cloneButton.className = "fas fa-copy text-warning float-left mr-2 mt-1 record-control"
            
            cloneButton.onclick = () => {
                let recup = jmarc.clone();
                try {
                    recup.post()
                    this.callChangeStyling("Record " + jmarc.recordId + " has been cloned", "row alert alert-success")
                } catch (error) {
                    this.callChangeStyling(error.message,"row alert alert-danger")
                }              
            };

            if(this.readonly && this.user !== null) {
                let editLink = document.createElement("a");
                let uibase = this.prefix.replace("/api/","");
                editLink.href = `${uibase}/editor?records=${jmarc.collection}/${jmarc.recordId}`;
                idCell.appendChild(editLink);
                let addRemoveBasketButton = document.createElement("i");
                editLink.appendChild(addRemoveBasketButton);
                addRemoveBasketButton.type = "button";
                addRemoveBasketButton.value = "edit";
                addRemoveBasketButton.setAttribute("data-toggle","tooltip") 
                addRemoveBasketButton.className="fas fa-edit edit-record";
                addRemoveBasketButton.title = "Edit Record";
                editLink.addEventListener("click", async (e) => {
                    e.preventDefault();
                    await basket_api.createItem(this.prefix, "userprofile/my_profile/basket", jmarc.collection, jmarc.recordId).then(res => {
                        window.location.href = editLink.href;
                    })
                })
            }
            
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
            
            deleteItem.onclick = () => {
                try {
                    
                    
                    /*
                    if (this.record1 === String(jmarc.recordId)) {
                        this.removeRecordFromEditor(jmarc.div)
                    }
                    if (this.record2 === String(jmarc.recordId)) {
                        this.removeRecordFromEditor(div)
                    }
                    */
                    this.removeRecordFromEditor(jmarc.div.id);
                    this.callChangeStyling("Record " + jmarc.recordId + " has been deleted", "row alert alert-success")
                    //this.removeFromBasket(jmarc.recordId, jmarc.collection)   
                    basket_api.getBasket(this.prefix, "userprofile/my_profile/basket").then(myBasket => {
                        basket_api.deleteItem(this.prefix, 'userprofile/my_profile/basket', myBasket, jmarc.collection, jmarc.recordId).then(deleted => {
                            let el = document.getElementById(`${jmarc.collection}--${jmarc.recordId}`);
                            el.parentElement.remove();
                        });
                    });
                    jmarc.delete();
                } catch (error) {
                    this.callChangeStyling(error.message,"row alert alert-danger")
                }  
            };
                    
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

            
            // Table body
            let tableBody = table.createTBody();
            
            // Fields
            for (let field of jmarc.fields.sort((a, b) => parseInt(a.tag) - parseInt(b.tag))) {
                // Field row
                field.row = tableBody.insertRow();
                
                // Tag
                let tagCell = field.row.insertCell();
                field.tagCell = tagCell;
                tagCell.className = "badge badge-pill badge-warning dropdown-toggle";
                tagCell.setAttribute("data-toggle", "dropdown");
                tagCell.innerText = field.tag;
                
                // menu
                let tagMenu = document.createElement("div");
                tagCell.append(tagMenu);
                tagMenu.className = "dropdown-menu";
                tagMenu.style.cursor = "default";
                
                // add field
                let addField = document.createElement("i");
                tagMenu.append(addField);
                addField.className = "dropdown-item";
                addField.innerText = "Add field";
                
                addField.addEventListener("click", function() {
                    let newField = jmarc.createField(null, (field.row.rowIndex - 2 /*2 header rows*/) + 1);
                    let newSubfield = newField.createSubfield();
                    
                    let row = table.insertRow(field.row.rowIndex + 1);
                    let tagCell = row.insertCell();
                    
                    tagCell.contentEditable = true;
                    tagCell.innerText = "___";
                    
                    tagCell.addEventListener("input", function() {
                        newField.tag = tagCell.innerText;
                    });
                    
                    let fieldCell = row.insertCell();
                    let fieldTable = document.createElement("table");
                    fieldCell.append(fieldTable);
                    fieldTable.className = "marc-field";
                    
                    let subfieldRow = fieldTable.insertRow();
                    let codeCell = subfieldRow.insertCell();
                    codeCell.className = "subfield-code";
                    codeCell.contentEditable = true;
                    codeCell.innerHTML = "_";
                    
                    codeCell.addEventListener("input", function() {
                        newSubfield.code = codeCell.innerText;
                    });
                    
                    let valCell = subfieldRow.insertCell();
                    valCell.className = "subfield-value";
                    valCell.contentEditable = true;
                    valCell.innerHTML = "insert new subfield value";
                    
                    valCell.addEventListener("input", function() {
                        newSubfield.value = valCell.innerText;
                    });

                    for (let cell of [tagCell, codeCell, valCell]) {
                        cell.style.background="rgba(255, 255, 128, .5)";

                        cell.addEventListener("keydown", function(event) {
                            if (event.keyCode === 13) {
                                event.preventDefault();
                                cell.blur();
                            }
                        });
                    }
                });
                
                // delete field
                let deleteField = document.createElement("i");
                tagMenu.append(deleteField);
                deleteField.className = "dropdown-item";
                deleteField.innerText = "Delete field";
                
                deleteField.addEventListener("click", function() {
                    jmarc.deleteField(field);
                    table.deleteRow(field.row.rowIndex);
                    saveButton.classList.add("text-danger");
                    saveButton.setAttribute("data-toggle", "tooltip");
                    saveButton.title = "unsaved changes";
                });
                
                // Field table
                let fieldCell = field.row.insertCell();
                let fieldTable = document.createElement("table");
                fieldCell.append(fieldTable);
                fieldTable.className = "marc-field";
                
                // Controlfield
                if (field.constructor.name == "ControlField") {
                    field.row.classList.add("hidden-field");
                    
                    let fieldRow = fieldTable.insertRow();
                    fieldRow.insertCell().className = "subfield-code"; // placeholder for subfield code column
                    let valCell = fieldRow.insertCell();
                    valCell.innerHTML = field.value;
                    
                    continue; 
                }
                
                // Datafield
                for (let subfield of field.subfields) {
                    subfield.row  = fieldTable.insertRow();

                    // Subfield code
                    let codeCell = subfield.row.insertCell();
                    codeCell.innerText = subfield.code;
                    codeCell.className = "subfield-code badge badge-pill bg-primary text-light dropdown-toggle";
                    codeCell.setAttribute("data-toggle", "dropdown");
                    
                    // menu
                    let codeMenu = document.createElement("div");
                    codeCell.append(codeMenu);
                    codeMenu.className = "dropdown-menu";
                    codeMenu.style.cursor = "default";
                    
                    // add subfield
                    let addSubfield = document.createElement("i");
                    codeMenu.append(addSubfield);
                    addSubfield.className = "dropdown-item";
                    addSubfield.innerText = "Add subfield";
                    
                    addSubfield.addEventListener("click", function() {
                        // New table row
                        let newSubfield = field.createSubfield(null, field.subfields.indexOf(subfield) + 1);             
                        let newRow = fieldTable.insertRow(subfield.row.rowIndex + 1);

                        // New code
                        let newCodeCell = newRow.insertCell();
                        newCodeCell.textContent = "_";
                        newCodeCell.contentEditable = true;
                        
                        newCodeCell.addEventListener('input', () => {
                            newSubfield.code = newCodeCell.textContent;
                        });
                        
                        // New value
                        let newValueCell = newRow.insertCell();                                          
                        newValueCell.textContent = "insert new subfield value";
                        newValueCell.contentEditable = true;
                        
                        // visual effect to show the update status
                        newCodeCell.style.background="rgba(255, 255, 128, .5)";
                        newValueCell.style.background="rgba(255, 255, 128, .5)";

                        newValueCell.addEventListener('input', () => {
                            newSubfield.value = newValueCell.textContent;
                        });
                        
                        for (let cell of [newCodeCell, newValueCell]) {
                            cell.addEventListener('keydown', event => {
                                if (event.keyCode === 13) {
                                    // return key
                                    event.preventDefault();
                                    cell.blur();
                                }
                            });
                        }
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
                        fieldTable.deleteRow(subfield.row.rowIndex);

                        saveButton.classList.add("text-danger");
                        saveButton.setAttribute("data-toggle", "tooltip");
                        saveButton.title = "unsaved changes";
                    });
                    
                    // Subfield value
                    let valCell = subfield.row.insertCell();
                    valCell.className = "subfield-value";
                    valCell.contentEditable = true; // not used but makes cell clickable
                    valCell.setAttribute("data-taggle", "tooltip");
                    valCell.title = `The human-readable field name for ${field.tag}\$${subfield.code}`;
                    
                    let valSpan = document.createElement("span");
                    valSpan.align = "left";
                    valSpan.style.width = "100%"
                    valCell.appendChild(valSpan);
                    subfield.valueElement = valSpan; // save the value HTML element in the subfield object
                    valSpan.innerHTML = subfield.value;
                    valSpan.contentEditable = true;
                    
                    // change focus to span when cell is clicked
                    valCell.addEventListener("focus", function () {valSpan.focus()});

                    valCell.addEventListener("input", function () {
                        subfield.value = valSpan.innerText;
                        
                        let savedState = new Jmarc(jmarc.collection);
                        savedState.parse(jmarc.savedState);
                        let i = field.subfields.indexOf(subfield);
                        let checkField = savedState.getField(field.tag);
                        let checkSubfield = checkField ? checkField.subfields[i] : null;

                        if (checkSubfield === null || subfield.value !== checkSubfield.value) {
                            valCell.style.background = "rgba(255, 255, 128, .5)"
                        } 
                        else if (checkSubfield.value === subfield.value) {
                            valCell.style.background = "";
                        }
                    });

                    valCell.addEventListener("blur", function() {
                        if (jmarc.saved) {
                            saveButton.classList.remove("text-danger");
                            saveButton.title = "no new changes";
                        }
                        else {
                            saveButton.classList.add("text-danger");
                            saveButton.setAttribute("data-toggle", "tooltip");
                            saveButton.title = "unsaved changes";
                        }
                    });
                    
                    valCell.addEventListener("keydown", function (event) {
                        // prevent newline and blur on return key
                        if (event.keyCode === 13) {
                            event.preventDefault();
                            valCell.blur();
                        }
                    });
                    
                    // auth controlled
                    if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
                        valSpan.className = "authority-controlled"; // for styling
                          
                        // xref
                        let xrefCell = subfield.row.insertCell();
                        subfield.xrefElement = xrefCell; // save the xref HTML element in the subfield object
                        
                        let xrefLink = document.createElement("a");
                        xrefCell.appendChild(xrefLink);
                        xrefLink.href = `${this.prefix}/records/auths/${subfield.xref}`.replace('/api/','');
                        xrefLink.target="_blank";
                          
                        let xrefIcon = document.createElement("i");
                        xrefIcon.className = "fas fa-link float-left mr-2";
                        xrefLink.appendChild(xrefIcon);
                          
                        // lookup
                        let timer;
                          
                        valCell.addEventListener("keyup", function (event) {
                            if (event.keyCode < 45 && event.keyCode !== 8) {
                                // non ascii or delete keys
                                return
                            }
                                
                            let originalColor = valSpan.style.backgroundColor;
                            valSpan.style.backgroundColor = "LightCoral";
                            xrefCell.innerHTML = null;
                    
                            let dropdown = document.getElementById("typeahead-dropdown");
                            dropdown && dropdown.remove();
                    
                            clearTimeout(timer);
                            subfield.value = valCell.innerText;
                    
                            if (subfield.value) {
                                timer = setTimeout(
                                    function () {
                                        let dropdown = document.createElement("div");
                                        valCell.appendChild(dropdown);
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
                                                item.className = "list-group-item";
                                                
                                                item.innerHTML = choice.subfields.map(x => `<span style="color: blue">$${x.code}</span> ${x.value}`).join("<br>");
                                                
                                                item.addEventListener("mouseover", function () {
                                                    item.style.backgroundColor = "gray"
                                                });
                                                
                                                item.addEventListener("mouseout", function () {
                                                    item.style.backgroundColor = "";
                                                    subfield.value = valSpan.innerText
                                                });
                                                
                                                item.addEventListener("mousedown", function () {
                                                    dropdown.remove()
                                        
                                                    for (let newSubfield of choice.subfields) {
                                                        let currentSubfield = field.getSubfield(newSubfield.code);
                                                        
                                                        if (typeof currentSubfield === "undefined") {
                                                            // the field does not already exist
                                                            field.subfields.push(newSubfield);
                                                            currentSubfield = newSubfield;
                                                                
                                                            // create new subfield in table (again)
                                                            // get the place of the previous subfield
                                                            let place = field.subfields.indexOf(currentSubfield);
                                                            let newRow = fieldTable.insertRow(subfield.row.rowIndex + 1); // needs fix
                                                            newRow.insertCell().innerText = currentSubfield.code;
                                                            // value element does not have event listeners
                                                            currentSubfield.valueElement = newRow.insertCell();
                                                            currentSubfield.innerText = currentSubfield.value;
                                                            currentSubfield.xrefElement = newRow.insertCell();
                                                        }
                                        
                                                        currentSubfield.value = newSubfield.value;
                                                        currentSubfield.xref = newSubfield.xref;
                                        
                                                        currentSubfield.valueElement.innerText = currentSubfield.value;
                                                        currentSubfield.valueElement.style.backgroundColor = "";
                                                            
                                                        let xrefLink = document.createElement("a");
                                                        xrefLink.href = `/records/auths/${newSubfield.xref}`;
                                                        xrefLink.target="_blank";
                                                            
                                                        let xrefIcon = document.createElement("i");
                                                        xrefIcon.className = "fas fa-link float-left mr-2";
                                                        xrefLink.appendChild(xrefIcon);
                                                            
                                                        while (currentSubfield.xrefElement.firstChild) {
                                                            currentSubfield.xrefElement.removeChild(currentSubfield.xrefElement.firstChild)
                                                        }
                                                            
                                                        currentSubfield.xrefElement.append(xrefLink);
                                                    }
                                                });
                                            }
                                        });
                                    }, 
                                    750
                                );
                            }
                        });
                    }
                }
            }
            
            return table       
        }
    }
}

