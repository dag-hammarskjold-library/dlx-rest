  
let recup=""
/////////////////////////////////////////////////////////////////
// IMPORT
/////////////////////////////////////////////////////////////////

import { Jmarc } from "./jmarc.js";

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
        }
    },
    template: ` 
        <div class="container mt-3 col-sm-10" id="app1" style="background-color:white;">
            <div class='mt-3 shadow' style="overflow-y: scroll; height:650px;">
                <div><h5 class="badge bg-success mt-2 ml-3">Editor</h5></div>
                    <div v-show="this.isRecordOneDisplayed==false && this.isRecordTwoDisplayed==false" mt-5>
                        <div class="ml-3 mr-3 jumbotron jumbotron-fluid">
                            <div class="container">
                                <h1 class="display-4 text-center">No record selected</h1>
                                <p class="lead text-center">please select record from the basket,clicking on the title(green)!!!</p>
                            </div>
                        </div>                                
                    </div>
                    <div id="records" class="row ml-3">
                        <div id="record1" v-show="this.isRecordOneDisplayed" class="col-sm-6 mt-1" style="border-left: 5px solid green;border-radius: 5px;">
                            <div>
                                <button id="remove1" type="button" class="btn btn-outline-success" v-on:click="removeRecordFromEditor('record1')">Remove this record</button>
                            </div>
                    </div>
                    <div id="record2" v-show="this.isRecordTwoDisplayed" class="col-sm-6 mt-1" style="border-left: 5px solid green;border-radius: 5px;">
                        <div>
                            <button id="remove2" type="button" class="btn btn-outline-success" v-on:click="removeRecordFromEditor('record2')">Remove this record</button>
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
            id: ""
        }
    },
    created() {
        this.$root.$refs.multiplemarcrecordcomponent = this;
        if (this.records) {
            this.records.split(",").forEach(
                record => {
                    var split_rec = record.split("/")
                    this.displayMarcRecord(split_rec[1], split_rec[0])
                }
            );
            recup=this
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
        async displayMarcRecord(recId, myColl="bibs") {
            Jmarc.apiUrl = this.prefix;
            let jmarc = await Jmarc.get(myColl, recId);
            let table = document.createElement("table");
            
            // some styling for the table
            table.style.width="400px";
            table.style.tableLayout = "fixed";
            table.className="w-auto table-striped"
            
            // Adding event listener on the table to catch the index
            let rows 
            let rowsArray 
            let rowIndex 
            let columns 
            let columnIndex 
            
            // Save Button
            let idRow = table.insertRow();
            let idCell = idRow.insertCell();
            idCell.colSpan = 3;
            let headerField = document.createElement("h5");
            idCell.appendChild(headerField);
            headerField.innerText = `${myColl}/${recId}`;
            headerField.className = "float-left mx-2";
            let saveButton = document.createElement("i");
            //saveCell.appendChild(saveButton);
            idCell.appendChild(saveButton);
            saveButton.type = "button";
            saveButton.value = "save";
            saveButton.className = "fas fa-save text-primary float-left mr-2 mt-1"
            saveButton.onclick = () => {
                jmarc.put().then(
                    jmarc => {
                        let parentElement = saveButton.parentElement
                        let parentElementPlus=parentElement.parentElement
                        let parentElementPlusPlus=parentElementPlus.parentElement
                        let parentElementPlusPlusPlus=parentElementPlusPlus.parentElement
                        let parentElementPlusPlusPlusPlus=parentElementPlusPlusPlus.parentElement

                        this.removeRecordFromEditor(""+parentElementPlusPlusPlusPlus.id)
                        console.log(jmarc.recordId)
                        this.displayMarcRecord(jmarc.recordId,jmarc.collection)

                        this.callChangeStyling("Record " + recId + " has been updated/saved", "row alert alert-success")
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
            cloneButton.className = "fas fa-copy text-warning float-left mr-2 mt-1"
            cloneButton.onclick = () => {
                let recup = jmarc.clone();
                try {
                    recup.post()
                    this.callChangeStyling("Record " + recId + " has been cloned", "row alert alert-success")
                } catch (error) {
                    this.callChangeStyling(error.message,"row alert alert-danger")
                }              
            };  

            // Add TAG button
            let addTagButton = document.createElement("i");
            idCell.appendChild(addTagButton);
            addTagButton.type = "button";
            addTagButton.value = "refresh";
            addTagButton.className = "fas fa-plus-circle text-primary float-left mr-2 mt-1"
            addTagButton.onclick = () => {
                // to be implemented
            };    
            

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
            deleteButton.className = "fas fa-trash-alt text-danger dropdown-toggle mr-2";
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
                    jmarc.delete();
                    
                    if (this.record1 === String(recId)) {
                        this.removeRecordFromEditor("record1")
                    }
                    if (this.record2 === String(recId)) {
                        this.removeRecordFromEditor("record2")
                    }
                    this.callChangeStyling("Record " + recId + " has been deleted", "row alert alert-success")
                    this.removeFromBasket(recId, myColl)                  
                } catch (error) {
                    this.callChangeStyling(error.message,"row alert alert-danger")
                }  
            };
                    
            //Make a row for files
            let filesRow = table.insertRow();
            let filesCell = filesRow.insertCell();
            filesCell.colSpan = 6;
            filesCell.className = "text-wrap"
            let filesUL = document.createElement("ul");
            filesUL.className = "list-group list-group-horizontal list-group-flush m-0 p-0";
            filesCell.appendChild(filesUL);
            for (let f of jmarc.files) {
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
                    
            
            for (let field of jmarc.fields.sort((a, b) => parseInt(a.tag) - parseInt(b.tag))) {
                let row = table.insertRow();
            
                let tagCell = row.insertCell();
                tagCell.innerHTML = "<span class='badge badge-pill badge-warning'>" +field.tag+"</span>";             
            
                if (field.constructor.name == "ControlField") {
                    // controlfield
                    row.insertCell(); // placeholder
            
                    let valCell = row.insertCell();
                    valCell.innerHTML = field.value;
                }
                else {
                    // datafield
                    
                    for (let subfield of field.subfields) {

                        let subRow = table.insertRow()
                        let opeCell=subRow.insertCell(); 

                        // creation of the minus element
                        let minusSign=document.createElement("i");
                        minusSign.className="ml-1 fas fa-minus-square"

                        minusSign.addEventListener("click",()=>{

                            let answer = window.confirm("Do you want to delete this row?");
                            if (answer) {
                                let targetedRow=subRow.rowIndex
                                alert("Deleting the row " + targetedRow)                                       
                                //let thisSubfieldItem = {}
                                let thisCode = subRow.children[1].textContent;
                                let thisValue = subRow.children[2].textContent;
                                //Remove the subfield from the jmarc object's subfields for this tag
                                field.subfields = field.subfields.filter( el => el.code !== thisCode && el.value !== thisValue)
                                // Assign the values to the subfield
                                let subfieldItem = {}
                                subfieldItem['code'] = thisCode
                                subfieldItem['value'] = thisValue
                                // Delete the subfield
                                field.deleteSubfield(subfieldItem)
                                // Update the jmarc object
                                // jmarc.put()
                                //Remove the subfield row from the table
                                table.deleteRow(targetedRow);
                                
                            }
                            else {
                                alert("Operation canceled!!!")    
                            }
                        })  
                        
                        // adding minusSign to the cell 
                        opeCell.appendChild(minusSign)

                        // creation of the plus element
                        let plusSign=document.createElement("i");
                        plusSign.className="ml-1 fas fa-plus-square"

                        plusSign.addEventListener("click",()=>{

                            let answer = window.confirm("Do you want to add a new row?");
                            if (answer) {
                            
                                let targetedRow=subRow.rowIndex+1
                                alert("Adding new row at the position " + targetedRow)                                       
                                let subRow1 = table.insertRow(targetedRow)
                                //This cell holds the subfield controls (add/remvoe)
                                let opeCell1=subRow1.insertCell(); 
                                //This cell holds the subfield code
                                let opeCell2=subRow1.insertCell();
                                //This cell holds the subfield value
                                let opeCell3=subRow1.insertCell();

                                // visual effect to show the update status
                                opeCell1.style.background="rgba(255, 255, 128, .5)";
                                opeCell2.style.background="rgba(255, 255, 128, .5)";
                                opeCell3.style.background="rgba(255, 255, 128, .5)";

                                // This is a default value for the subfield code
                                opeCell2.textContent = "_";
                                opeCell2.contentEditable = true;

                                // This is a default value for the subfield value                                            
                                opeCell3.textContent = "insert new subfield value";
                                opeCell3.contentEditable = true;
                                opeCell2.select();
                                
                                opeCell3.onblur = () => {
                                    let newSubfield = field.createSubfield();
                                    newSubfield.code = opeCell2.textContent;
                                    newSubfield.value = opeCell3.textContent;
                                
                                    if (newSubfield.code !== "_" && newSubfield.value) {
                                        opeCell1.style.background="";
                                        opeCell2.style.background="";
                                        opeCell3.style.background="";
                                    }
                                    
                                    // Update the jmarc object
                                    // jmarc.put()
                                }

                            }
                            else {
                                alert("Operation canceled!!!")    
                            }
                        })  

                        
                        
                        // adding plusSign to the cell 
                        opeCell.appendChild(plusSign)

                        ///////////////////////////////////////////////
                        ////////////////////////////////////////////////
                        
                        let codeCell = subRow.insertCell();
                        codeCell.innerHTML = subfield.code;
                        
                        // value
                        let valCell = subRow.insertCell();
                        valCell.contentEditable = true; // not used but makes cell clickable
                        let valSpan = document.createElement("span");
                        
                        // update the size of the span
                        valSpan.style.width="100%"
                        valCell.appendChild(valSpan);
                        subfield.valueElement = valSpan; // save the value HTML element in the subfield object
                        valSpan.innerHTML = subfield.value;
                        valSpan.contentEditable = true;
                        valCell.addEventListener("focus", function () { valSpan.focus() });
                        
                        if (jmarc.isAuthorityControlled(field.tag, subfield.code)) {
                            valSpan.className = "authority-controlled"; // for styling
                              
                            // xref
                            let xrefCell = subRow.insertCell();
                            subfield.xrefElement = xrefCell; // save the xref HTML element in the subfield object
                            //xrefCell.innerHTML = subfield.xref;
                            let xrefLink = document.createElement("a");
                            xrefCell.appendChild(xrefLink);
                            //xrefLink.text = subfield.xref;
                            //xrefLink.href = `${Jmarc.apiUrl}marc/auths/records/${subfield.xref}?format=mrk`;
                            xrefLink.href = `/records/auths/${subfield.xref}`;
                            xrefLink.target="_blank";
                              
                            let xrefIcon = document.createElement("i");
                            xrefIcon.className = "fas fa-link float-left mr-2";
                            xrefLink.appendChild(xrefIcon);
                              
                            // lookup
                            let timer;
                              
                            valCell.addEventListener(
                                "keyup",
                                function (event) {
                                    if (event.keyCode < 45 && event.keyCode !== 8) {
                                        // non ascii or delete keys
                                        return
                                    }
                        
                                    valSpan.style.backgroundColor = "red";
                                    xrefCell.innerHTML = null;
                        
                                    let popup = document.getElementById("typeahead-popup");
                                    popup && popup.remove();
                        
                                    clearTimeout(timer);
                                    subfield.value = valCell.innerText;
                        
                                    if (subfield.value) {
                                        timer = setTimeout(
                                            function () {
                                                let popup = document.createElement("div");
                                                valCell.appendChild(popup);
                                                popup.id = "typeahead-popup";
                                                popup.innerHTML = "searching...";
                                                
                                                field.lookup().then(
                                                    choices => {
                                                        if (choices.length == 0) {
                                                            popup.innerHTML = "not found";
                                                            setTimeout(function () { popup.remove() }, 1000)
                                                            return
                                                        }
                                                    
                                                        popup.innerHTML = null;
                                                
                                                        let list = document.createElement("ul");
                                                        popup.appendChild(list);
                                                
                                                        for (let choice of choices) {
                                                            let item = document.createElement("li");
                                                            list.appendChild(item);
                                                            item.innerHTML = choice.subfields.map(x => `$${x.code} ${x.value}`).join(" ");
                                                
                                                            item.addEventListener(
                                                                "mouseover",
                                                                function () { item.style.backgroundColor = "gray" }
                                                            );
                                                
                                                            item.addEventListener(
                                                                "mouseout",
                                                                function () {
                                                                    item.style.backgroundColor = "white";
                                                                    subfield.value = valSpan.innerText
                                                                }
                                                            );
                                                
                                                            item.addEventListener(
                                                                "mousedown",
                                                                function () {
                                                                    popup.remove()
                                                
                                                                    for (let newSubfield of choice.subfields) {
                                                                        let currentSubfield = field.getSubfield(newSubfield.code);
                                                
                                                                        currentSubfield.value = newSubfield.value;
                                                                        currentSubfield.xref = newSubfield.xref;
                                                
                                                                        currentSubfield.valueElement.innerHTML = currentSubfield.value;
                                                                        currentSubfield.valueElement.style.backgroundColor = "white";
                                                                        currentSubfield.xrefElement.innerHTML = currentSubfield.xref;
                                                                    }
                                                                }
                                                            );
                                                        }
                                                    }
                                                );
                                            },
                                            750
                                        );
                                    }
                                }
                            )
                        }
                        
                        valCell.addEventListener(
                            "blur",
                            function () {
                                subfield.value = valSpan.innerText;
                                console.log(`user entered value "${subfield.value}"`);
                            }
                        );
                        
                        valCell.addEventListener(
                            "keydown",
                            function (event) {
                                if (event.keyCode === 13) {
                                    // return key
                                    event.preventDefault();
                                    valCell.blur();
                                }
                            }
                        );
                    }
                }
            }
                  
            table.style.marginTop="5px";
                  
            if (this.isRecordOneDisplayed == false) {
                let myRecord1 = document.getElementById("record1");
                myRecord1.appendChild(table)
                this.isRecordOneDisplayed = true
                this.record1 = recId;
                // further styling for the div
                if (myColl==="bibs") {
                    this.collectionRecord1="bibs"
                    table.style.border="2px solid green";    
                }
                else {
                    this.collectionRecord1="auths"
                    table.style.border="2px solid purple";    
                }
            }
            else if (this.isRecordTwoDisplayed == false) {
                let myRecord2 = document.getElementById("record2");
                myRecord2.appendChild(table)
                this.isRecordTwoDisplayed = true
                this.record2 = recId;
                // further styling for the div
                if (myColl==="bibs") {
                    this.collectionRecord2="bibs"
                    table.style.border="3px solid green";    
                }
                else {
                    this.collectionRecord2="auths"
                    table.style.border="3px solid purple";    
                }
            }
            
        }
    }
}

