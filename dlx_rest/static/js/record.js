  
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
                        <div>
                            <button v-if="readonly" id="remove1" type="button" class="btn btn-outline-success mb-2" style="display:none" v-on:click="removeRecordFromEditor('record1')">Remove this record</button>
                            <button v-else id="remove1" type="button" class="btn btn-outline-success mb-2" v-on:click="removeRecordFromEditor('record1')">Remove this record</button>
                        </div>
                    </div>
                    <div id="record2" v-show="this.isRecordTwoDisplayed" class="col-sm-6 mt-1" style="border-left: 5px solid green;border-radius: 5px;">
                        <div>
                            <button v-if="readonly" id="remove2" type="button" class="btn btn-outline-success mb-2" style="display:none" v-on:click="removeRecordFromEditor('record2')">Remove this record</button>
                            <button v-else id="remove2" type="button" class="btn btn-outline-success mb-2" v-on:click="removeRecordFromEditor('record2')">Remove this record</button>
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

                // change the styling of the table
                table.style.width="100%"

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

                // change the styling of the table
                table.style.width="100%"
    
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

                // change the styling of the table
                table.style.width=""
    
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
                console.log("true")
            } 
            else {
                return false
                console.log("false")
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
            let component = this; // for use in event listeners 
            let table = document.createElement("table");
            jmarc.table = table;

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
            if (jmarc.workformName) {
                idField.innerText = `${jmarc.collection}/workforms/${jmarc.workformName}`;
            } else {
                let recordId = jmarc.recordId ? jmarc.recordId : "<New Record>"
                idField.innerText = `${jmarc.collection}/${recordId}`;
            }
            
            idField.className = "float-left mx-2";
            
            // Save Button
            let saveDiv = document.createElement("div");
            idCell.appendChild(saveDiv);
            saveDiv.className = "dropdown";

            let saveButton = document.createElement("i");
            jmarc.saveButton = saveButton;
            saveDiv.appendChild(saveButton);
            saveButton.id="saveButton"
            saveButton.type = "button";
            saveButton.value = "save";
            saveButton.className = "fas fa-save text-primary float-left mr-2 mt-1 record-control";
            saveButton.setAttribute("data-toggle", "dropdown");

            let saveDropdown = document.createElement("div");
            saveDiv.appendChild(saveDropdown);
            saveDropdown.className = "dropdown-menu";
            saveDropdown.setAttribute("aria-labelledBy", "saveDropdow");

            // This could be DRYer I think
            if (jmarc.workformName) {
                let saveToRecord  = document.createElement("a");
                saveDropdown.appendChild(saveToRecord);
                saveToRecord.className = "dropdown-item";
                saveToRecord.innerText = "Create Record from This Workform";
                saveToRecord.href = "#";
                saveToRecord.onclick = () => {
                    // This only creates new records, so we only need post
                    jmarc.post().then(jmarc => {
                        jmarc.workformName = null;
                        jmarc.workformDescription = null;
                        this.removeRecordFromEditor(jmarc.div.id); // div element is stored as a property of the jmarc object
                        this.displayMarcRecord(jmarc, false);
                        this.callChangeStyling(`Record ${jmarc.collection}/${jmarc.recordId} created from workform.`, "row alert alert-success")
                    }).catch(error => {
                        this.callChangeStyling(error.message, "row alert alert-danger");
                    })
                }

                let saveWorkform  = document.createElement("a");
                saveDropdown.appendChild(saveWorkform);
                saveWorkform.className = "dropdown-item";
                saveWorkform.innerText = "Save This Workform";
                saveWorkform.href = "#";
                saveWorkform.onclick = () => {
                    if (jmarc.newWorkForm) {
                        jmarc.saveAsWorkform(jmarc.workformName, jmarc.workformDescription).then( () => {
                            this.removeRecordFromEditor(jmarc.div.id); // div element is stored as a property of the jmarc object
                            this.displayMarcRecord(jmarc, false);
                            this.callChangeStyling(`Workform ${jmarc.collection}/workforms/${jmarc.workformName} saved.`, "row alert alert-success")
                        })
                    } else {
                        jmarc.saveWorkform(jmarc.workformName, jmarc.workformDescription).then( () => {
                            this.removeRecordFromEditor(jmarc.div.id); // div element is stored as a property of the jmarc object
                            this.displayMarcRecord(jmarc, false);
                            this.callChangeStyling(`Workform ${jmarc.collection}/workforms/${jmarc.workformName} saved.`, "row alert alert-success")
                        });
                    }
                }
            } 
            else {
                let saveRecord  = document.createElement("a");
                saveDropdown.appendChild(saveRecord);
                saveRecord.className = "dropdown-item";
                saveRecord.innerText = "Save This Record";
                saveRecord.href = "#";

                saveRecord.onclick = () => {
                    if (jmarc.saved) {
                        // todo: not detecting changes to indicators
                        //this.callChangeStyling("No unsaved changes", "row alert alert-danger");
                        //return
                    }
                    
                    let promise = jmarc.recordId ? jmarc.put() : jmarc.post();

                    promise.then(jmarc => {
                        this.removeRecordFromEditor(jmarc.div.id); // div element is stored as a property of the jmarc object
                        this.displayMarcRecord(jmarc, false);
                        this.callChangeStyling("Record " + jmarc.recordId + " has been updated/saved", "row alert alert-success")
                    }).catch(error => {
                        this.callChangeStyling(error.message.substring(0, 100), "row alert alert-danger");
                    });
                }

                let saveToWorkform  = document.createElement("a");
                saveDropdown.appendChild(saveToWorkform);
                saveToWorkform.className = "dropdown-item";
                saveToWorkform.innerText = "Create Workform from This Record";
                saveToWorkform.href = "#";
                saveToWorkform.setAttribute("data-toggle", "modal");
                saveToWorkform.setAttribute("data-target", "#nameWorkform");
                saveToWorkform.onclick = () => {
                    jmarc.workformName = "<new>";
                    jmarc.workformDescription = " ";
                    jmarc.newWorkForm = true;
                    this.removeRecordFromEditor(jmarc.div.id); // div element is stored as a property of the jmarc object
                    this.displayMarcRecord(jmarc, false);
                    this.callChangeStyling("Name your new workform, then choose Save -> Save This Workform", "row alert alert-warning")
                }
            }
                    
            // clone record  
            let cloneButton = document.createElement("i");
            idCell.appendChild(cloneButton);
            cloneButton.type = "button";
            cloneButton.value = "clone";
            cloneButton.className = "fas fa-copy text-warning float-left mr-2 mt-1 record-control"
            
            cloneButton.onclick = () => {
                let recup = jmarc.clone();
                this.removeRecordFromEditor(jmarc.div.id); // div element is stored as a property of the jmarc object
                this.callChangeStyling("Record " + jmarc.recordId + " has been cloned and removed from the editor. Displaying new record", "row alert alert-success")
                this.displayMarcRecord(recup, false); // add this to the basket?
                recup.saveButton.classList.add("text-danger");
                recup.saveButton.classList.remove("text-primary");
                recup.saveButton.title = "unsaved changes";
                
                for (let field of recup.fields) {
                    if (! field.tag.match(/^00/)) {
                        for (let subfield of field.subfields) {
                            subfield.valueCell.classList.add("subfield-value-unsaved");
                        }
                    }
                }
            };

            // paste button
            let pasteButton = document.createElement("i");
            idCell.appendChild(pasteButton);
            pasteButton.type = "button";
            pasteButton.value = "paste";
            pasteButton.className = "far fa-arrow-alt-circle-down text-warning float-left mr-2 mt-1 record-control"
            let xxx=this    
            pasteButton.onclick = () => {
                // retrieve length of the list
                let sizeSubfields=xxx.listElemToCopy.length

                // browse the list in order to find the records eligible for pasting
                for (let i = 0; i < sizeSubfields; i++) {

                    if (jmarc.collection==xxx.listElemToCopy[i].collection){

                        // check the different recordIDs
                        if (jmarc.recordId!=xxx.listElemToCopy[i].recordIdToCopy){
                            
                            // instanciate a new jmarc with the data of the new field to display and add the field
                            jmarc.fields.push(xxx.listElemToCopy[i].fieldToCopy)  
                            
                            // ///////// we probably should refactor this part using a function
                            // let promise = jmarc.recordId === null ? jmarc.post() : jmarc.put();

                            // promise.then(
                            //     jmarc => {
                            //         this.removeRecordFromEditor(jmarc.div.id); // div element is stored as a property of the jmarc object
                            //         this.displayMarcRecord(jmarc, false);
                            //         this.callChangeStyling("Record " + jmarc.recordId + " has been updated/saved", "row alert alert-success")
                            //     }
                            // ).catch(
                            //     error => {
                            //         this.callChangeStyling(error.message,"row alert alert-danger")
                            //     }
                            // );

                            // clear all the checkboxes using jquery jajajaja
                            $('input[type=checkbox]').prop('checked', false);

                            this.callChangeStyling("Field copied, click save button to see the changes", "row alert alert-success")


                        }
                        else
                        {
                            this.callChangeStyling("Oops , please destination and source records should be different ", "row alert alert-danger")
                            return
                        }

                    } 
                    else 
                    {
                        this.callChangeStyling("Oops , please destination and source records should have the same collection ", "row alert alert-danger")
                        return
                    }

                }

                ///////// we probably should refactor this part using a function
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

                // clear the list of Items
                xxx.clearItemsToPast()
            };

            if (this.readonly && this.user !== null) {
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
                    await basket.createItem(this.prefix, "userprofile/my_profile/basket", jmarc.collection, jmarc.recordId).then(res => {
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
            
            if (jmarc.workformName) {
                deleteItem.innerText = "Delete Workform";
                deleteItem.onclick = () => {
                    Jmarc.deleteWorkform(jmarc.collection, jmarc.workformName).then( () => {
                        this.removeRecordFromEditor(jmarc.div.id);
                        this.callChangeStyling(`Workform ${jmarc.collection}/workforms/${jmarc.workformName} has been deleted`, "row alert alert-success")
                        //this.removeFromBasket(jmarc.recordId, jmarc.collection)                  
                    })
                }
            } 
            else {
                deleteItem.onclick = () => {
                    let deletedRid = jmarc.recordId;
                    let deletedColl = jmarc.collection;

                    this.$root.$refs.basketcomponent.removeRecordFromList(jmarc.collection, jmarc.recordId).then( () => {
                        jmarc.delete().then( () => {
                            this.removeRecordFromEditor(jmarc.div.id);
                            this.callChangeStyling(`Record ${deletedColl}/${deletedRid} has been deleted`, "row alert alert-success");
                        }).catch( error => {
                            this.callChangeStyling(error.message,"row alert alert-danger");
                        });
                    })
                };
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

            
            // Table body
            let tableBody = table.createTBody();

            // Workform fields
            // Possibly move to header
            if (jmarc.workformName) {
                let wfNameRow = tableBody.insertRow();
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
                let wfDescRow = tableBody.insertRow();
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
            
            // Fields
            for (let field of jmarc.fields.sort((a, b) => parseInt(a.tag) - parseInt(b.tag))) {
                field = buildFieldRow(component, jmarc, table, tableBody, field);
            }
            
            table.addEventListener("input", function() {
                if (jmarc.saved) {
                    saveButton.classList.remove("text-danger");
                    saveButton.classList.add("text-primary");
                    saveButton.title = "no new changes";
                } else {
                    jmarc.saveButton.classList.add("text-danger");
                    jmarc.saveButton.classList.remove("text-primary");
                    jmarc.saveButton.title = "save";
                }
            });
            
            return table       
        }
    }
}

function buildFieldRow(component, jmarc, table, tableBody, field, place) {
    field.row = tableBody.insertRow(place);
    
    // add the checkboxes
    let checkCell = field.row.insertCell();
    checkCell.style = "vertical-align: top";
    let inputCheckboxCell = document.createElement("input");
    inputCheckboxCell.setAttribute("type","checkbox")
    checkCell.appendChild(inputCheckboxCell)
    
    // the instance of the calling object
    let that = component;

    // define the on click event
    checkCell.addEventListener('click', (e)=>{

        console.log("the value is : " + e.target.checked)
        console.log("the collection is: "+ jmarc.collection)
        
        // check if the box is checked
        if (e.target.checked==true){
            // mark the jmarc field as selected
            field.checked = true;

            // retrieve data in order to populate elemeToCopy
            that.elementToCopy.collection=jmarc.collection
            that.elementToCopy.recordIdToCopy=jmarc.recordId
            that.elementToCopy.fieldToCopy=field
            
            // add the element inside the list
            that.listElemToCopy.push(that.elementToCopy)
            
            // release the element
            that.elementToCopy={}

            // display content list
            // for (let i = 0; i < that.listElemToCopy.length; i++) {
            //     console.log("-----------------")
            //     console.log("tag: "+ that.listElemToCopy[i].fieldToCopy.tag)
            //     let sizeSubfields=that.listElemToCopy[i].fieldToCopy.subfields.length
            //     for (let j = 0; j < sizeSubfields; j++) {
            //         console.log("code: "+ that.listElemToCopy[i].fieldToCopy.subfields[j].code)
            //         console.log("value: "+that.listElemToCopy[i].fieldToCopy.subfields[j].value)
            //         if (that.listElemToCopy[i].fieldToCopy.subfields[j].xref){
            //             console.log("value: "+that.listElemToCopy[i].fieldToCopy.subfields[j].value)
            //         }
            //     }
            // }

        }
        if (e.target.checked==false) // browse the list and find the element to remove
        {
            // mark the jmarc field as unselected
            field.checked = false;
            
            // console.log("valeur liste : " + that.listElemToCopy[0].fieldToCopy.tag)
            // console.log("valeur field : " + field.tag)

            for (let i = 0; i < that.listElemToCopy.length; i++) {
                if (that.listElemToCopy[i].fieldToCopy.tag == field.tag) {
                    console.log("la valeur du field est:" + field.tag)
                        let findRecord=true
                        let sizeSubfields=that.listElemToCopy[i].fieldToCopy.subfields.length
                        for (let j = 0; j < sizeSubfields; j++) {
                            if (that.listElemToCopy[i].fieldToCopy.subfields[j].code!=field.subfields[j].code || that.listElemToCopy[i].fieldToCopy.subfields[j].value!=field.subfields[j].value){
                                findRecord=false
                            }
                        }

                        if (findRecord) {
                            // remove the value from the list
                            that.listElemToCopy.splice(i,1)
                        }

                    }
                }
            
        }
        //console.log("le tableau contient : " +  that.listElemToCopy.length)
    });

    // Tag + inds
    let tagCell = field.row.insertCell();
    field.tagCell = tagCell;
    tagCell.className = "badge badge-pill badge-warning dropdown-toggle";
    tagCell.setAttribute("data-toggle", "dropdown");
 
    let tagSpan = document.createElement("span");
    tagCell.append(tagSpan);
    field.tagSpan = tagSpan;
    tagSpan.contentEditable = true;
    tagSpan.innerText = field.tag;
    
    tagSpan.addEventListener("input", function () {        
        if (tagSpan.innerText.length > 3) {
            // don't allow more than 3 chars
            tagSpan.innerText = tagSpan.innerText.substring(0, 3)
            document.execCommand("selectall");
        }
        
        field.tag = tagSpan.innerText;
        
        let savedState = new Jmarc(jmarc.collection);
        savedState.parse(jmarc.savedState);

        for (let subfield of field.subfields) {
            if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
                setAuthControl(component, field, subfield, subfield.valueCell, subfield.valueSpan)
            } else {
                removeAuthControl(subfield);
            }
            
            let i = field.subfields.indexOf(subfield);
            let j = jmarc.fields.indexOf(field);
            let checkField = savedState.fields[j] ? savedState.fields[j] : null;
            let checkSubfield = checkField ? checkField.subfields[i] : null;

            if (! checkField || field.tag !== checkField.tag || ! checkSubfield || checkSubfield.code !== subfield.code || checkSubfield.value !== subfield.value) {
                field.tagCell.classList.remove("field-tag-saved");
                field.tagCell.classList.add("field-tag-unsaved");
                
                subfield.codeCell.classList.remove("subfield-code-saved");
                subfield.codeCell.classList.add("subfield-code-unsaved");
                
                subfield.valueCell.classList.remove("subfield-value-saved");
                subfield.valueCell.classList.add("subfield-value-unsaved");
            } 
            else {
                field.tagCell.classList.remove("field-tag-saved");
                field.tagCell.classList.add("field-tag-unsaved");
                
                subfield.codeCell.classList.remove("subfield-code-unsaved");
                subfield.codeCell.classList.add("subfield-code-saved");
                
                subfield.valueCell.classList.remove("subfield-value-usaved");
                subfield.valueCell.classList.add("subfield-value-saved");
            } 
        }
    });
    
    tagSpan.addEventListener("keydown", function (event) {
        // prevent newline and blur on return key
        if (event.keyCode === 13) {
            event.preventDefault();
            tagSpan.blur();
        }
    });

    tagSpan.addEventListener("mouseover", function() {
        tagSpan.focus()
    });
    
    tagSpan.addEventListener("click", function() {
        tagSpan.focus();
        document.execCommand("selectall", null, false);
    });

    // Indicators
    //can be refactored
    if (! field.tag.match(/^00/)) {
        let ind1Span = document.createElement("span");
        tagCell.append(ind1Span);
        ind1Span.className = "mx-1 text-secondary"
        ind1Span.innerText = field.indicators[0] || " ";
        ind1Span.contentEditable = true;
        
        ind1Span.addEventListener("input", function() {
            if (ind1Span.innerText.length > 1) {    
                ind1Span.innerText = ind1Span.innerText.substring(0, 1);
                document.execCommand("selectall");
            }
            
            field.indicators[0] = ind1Span.innerText;
        });
        
        ind1Span.addEventListener("focus", function() {
            ind1Span.focus();
            document.execCommand("selectall");
        });
        
        let ind2Span = document.createElement("span");
        tagCell.append(ind2Span);
        ind2Span.className = "mx-1 text-secondary"
        ind2Span.innerText = field.indicators[1]; // || " ";
        ind2Span.contentEditable = true;
        
        ind2Span.addEventListener("input", function() {
            if (ind2Span.innerText.length > 1) {    
                ind2Span.innerText = ind2Span.innerText.substring(0, 1);
                document.execCommand("selectall");
            }
            
            field.indicators[1] = ind2Span.innerText;
        });
        
        ind2Span.addEventListener("focus", function() {
            ind2Span.focus();
            document.execCommand("selectall");
        });
    }
        
    // menu
    let tagMenu = document.createElement("div");
    tagCell.append(tagMenu);
    tagMenu.className = "dropdown-menu";
    tagMenu.style.cursor = "default";
    tagSpan.setAttribute("data-toggle", "dropdown");
    
    // hide menu
    tagSpan.addEventListener("input", function() {
        $(tagMenu).dropdown('toggle');
    });
    
    // add field
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
        
        newField = buildFieldRow(component, jmarc, table, tableBody, newField, field.row.rowIndex - 1);
        newField.tagSpan.focus();
        document.execCommand("selectall");
        newField.subfields[0].valueCell.classList.add("subfield-value-unsaved");

        return
    });
    
    // delete field
    let deleteField = document.createElement("i");
    tagMenu.append(deleteField);
    deleteField.className = "dropdown-item";
    deleteField.innerText = "Delete field";
    
    deleteField.addEventListener("click", function() {
        jmarc.deleteField(field);
        table.deleteRow(field.row.rowIndex);
    });
    
    // Field table
    let fieldCell = field.row.insertCell();
    let fieldTable = document.createElement("table");
    field.fieldTable = fieldTable;
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
        buildSubfieldRow(component, jmarc, fieldTable, field, subfield);   
    }
    
    return field
}

function buildSubfieldRow(component, z, y, x, subfield, place) {
    let field = subfield.parentField;
    let table = field.fieldTable;
    let jmarc = field.parentRecord;
    
    // create the row
    subfield.row = table.insertRow(place);

    // Subfield code
    let codeCell = subfield.row.insertCell();
    subfield.codeCell = codeCell;
    codeCell.className = "subfield-code badge badge-pill bg-primary text-light dropdown-toggle";
    codeCell.setAttribute("data-toggle", "dropdown");
    
    let codeSpan = document.createElement("span");
    subfield.codeSpan = codeSpan;
    codeCell.append(codeSpan);
    codeSpan.contentEditable = true;
    codeSpan.innerText = subfield.code;
    
    codeSpan.setAttribute("data-toggle", "dropdown");

    codeSpan.addEventListener("input", function() {
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

        if (! checkSubfield || checkSubfield.code !== subfield.code || checkSubfield.value !== subfield.value) {
            subfield.codeCell.classList.add("subfield-code-saved");
            subfield.codeCell.classList.add("subfield-code-unsaved");
            subfield.valueCell.classList.remove("subfield-value-saved");
            subfield.valueCell.classList.add("subfield-value-unsaved");
        } 
        else {
            subfield.codeCell.classList.add("subfield-code-unsaved");
            subfield.codeCell.classList.add("subfield-code-saved");
            subfield.valueCell.classList.remove("subfield-value-unsaved");
            subfield.valueCell.classList.add("subfield-value-saved");
        }
    });
    
    codeSpan.addEventListener("keydown", function (event) {
        // prevent newline and blur on return key
        if (event.keyCode === 13) {
            event.preventDefault();
            codeSpan.blur();
        }
    });
    
    subfield.codeSpan.addEventListener("focus", function() {
        document.execCommand("selectall", null, false);
    });
    
    // menu
    let codeMenu = document.createElement("div");
    codeCell.append(codeMenu);
    codeMenu.className = "dropdown-menu";
    codeMenu.style.cursor = "default";
    
    // hide menu
    codeSpan.addEventListener("input", function() {
        $(codeMenu).dropdown('toggle')
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
        newSubfield = buildSubfieldRow(component, jmarc, table, field, newSubfield, place);
        
        newSubfield.codeSpan.focus();
        document.execCommand("selectall", null, false);
        
        newSubfield.valueCell.classList.add("subfield-value-unsaved");
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
    });
    
    // Subfield value
    let valCell = subfield.row.insertCell();
    valCell.className = "subfield-value";
    valCell.setAttribute("data-taggle", "tooltip");
    //valCell.title = `Guidelines for ${field.tag}\$${subfield.code} (pending)`;
    
    let valSpan = document.createElement("span");
    valSpan.align = "left";
    valSpan.style.width = "100%";
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
            valCell.classList.remove("subfield-value-saved");
            valCell.classList.add("subfield-value-unsaved");
        } 
        else {
            valCell.classList.remove("subfield-value-unsaved");
            valCell.classList.add("subfield-value-saved");
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
            setAuthControl(component,field, subfield, valCell, valSpan)
        } else {
            removeAuthControl(subfield)
        }
    });
    
    // create the last cell
    subfield.xrefCell = subfield.row.insertCell()
    
    // auth controlled
    if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
        setAuthControl(component, field, subfield, valCell, valSpan)
    }
    
    return subfield
}

function setAuthControl(component, field, subfield) {
    subfield.valueSpan.classList.add("authority-controlled");
    
    if (subfield.valueCell.classList.contains("subfield-value-unsaved")) {
        subfield.valueSpan.classList.add("authority-controlled-unmatched")
    }

    if (subfield.xrefCell.children.length === 0) {
        let xrefLink = document.createElement("a");
        subfield.xrefCell.appendChild(xrefLink);
        xrefLink.href = `/records/auths/${subfield.xref}`;
        xrefLink.target="_blank";
      
        let xrefIcon = document.createElement("i");
        xrefIcon.className = "fas fa-link float-left mr-2";
        xrefLink.appendChild(xrefIcon);
    }
      
    // lookup
    subfield.valueCell.eventParams = [component, subfield];
    subfield.valueCell.addEventListener("keyup", keyupAuthLookup);
}

function removeAuthControl(subfield) {
    if (subfield.xrefCell) {
        delete subfield.xref;
        subfield.xrefCell.innerHTML = "";
    }
    
    subfield.valueSpan.classList.remove("authority-controlled");
    subfield.valueSpan.classList.remove("authority-controlled-unmatched");
    subfield.valueCell.removeEventListener("keyup", keyupAuthLookup);
}

// auth-contiolled field keyup event function
function keyupAuthLookup(event) {
    //target: subfield value cell 
    let component = event.currentTarget.eventParams[0];
    let subfield = event.currentTarget.eventParams[1];
    let field = subfield.parentField;
    
    if (event.keyCode < 45 && event.keyCode !== 8) {
        // non ascii or delete keys
        return
    }

    subfield.valueSpan.classList.add("authority-controlled-unmatched"); // style.backgroundColor = "LightCoral";
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
                        item.className = "list-group-item";
                        
                        item.innerHTML = choice.subfields.map(x => `<span style="color: blue">$${x.code}</span> ${x.value}`).join("<br>");
                        
                        item.addEventListener("mouseover", function () {
                            item.style.backgroundColor = "gray"
                        });
                        
                        item.addEventListener("mouseout", function () {
                            item.style.backgroundColor = "";
                            subfield.value = subfield.valueSpan.innerText
                        });
                        
                        item.addEventListener("mousedown", function () {
                            dropdown.remove();

                            for (let s of field.subfields) {
                                s.valueSpan.classList.remove("authority-controlled-unmatched");
                                s.valueSpan.classList.add("authority-controlled-matched");
                            }
                
                            for (let choiceSubfield of choice.subfields) {
                                let currentSubfield = field.getSubfield(choiceSubfield.code);
                                
                                if (typeof currentSubfield === "undefined") {
                                    let place = choice.subfields.indexOf(choiceSubfield);
                                    let newSubfield = field.createSubfield(choiceSubfield.code, place);
                                    newSubfield.value = choiceSubfield.value;
                                    currentSubfield = newSubfield;
                                    buildSubfieldRow(component, null, null, null, newSubfield, place);
                                }
                
                                currentSubfield.value = choiceSubfield.value;
                                currentSubfield.xref = choiceSubfield.xref;
                                currentSubfield.valueElement.innerText = currentSubfield.value;
                                currentSubfield.valueElement.style.backgroundColor = "";
                                    
                                let xrefLink = document.createElement("a");
                                xrefLink.href = `/records/auths/${choiceSubfield.xref}`;
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
