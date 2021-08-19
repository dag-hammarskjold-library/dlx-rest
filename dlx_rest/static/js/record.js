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
    template: `<div class="container col-sm-8 mt-3 " id="app" style="background-color:white;">
                
                <div id="record" class='container mt-3 shadow' style="overflow-y: scroll; height:650px;">
                      <div><h5 class="badge bg-success mt-2">Editor</h5></div>
                      <div v-show="this.isRecordOneDisplayed==false && this.isRecordTwoDisplayed==false" mt-5>
                          <div class="jumbotron jumbotron-fluid">
                              <div class="container">
                                <h1 class="display-4 text-center">No record selected</h1>
                                <p class="lead text-center">please select record from the basket,clicking on the title(green)!!!</p>
                              </div>
                            </div>                                
                      </div>
                      <div id="records" class="row">
                          <div id="record1" v-show="this.isRecordOneDisplayed" class="col-sm-5 ml-3 mt-1" style="border-left: 5px solid green;border-radius: 5px;"><div><button id="remove1" type="button" class="btn btn-outline-success" v-on:click="removeRecordFromEditor('record1')">Remove this record</button></div></div>
                          <div id="record2" v-show="this.isRecordTwoDisplayed" class="col-sm-5 ml-5 mt-1" style="border-left: 5px solid green;border-radius: 5px;"><div><button id="remove2" type="button" class="btn btn-outline-success" v-on:click="removeRecordFromEditor('record2')">Remove this record</button></div></div>
  
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
      if(this.records) {
        this.records.split(",").forEach(record => {
          var split_rec = record.split("/")
          this.displayMarcRecord(split_rec[1], split_rec[0])
        });
      recup=this
      }
      
    },
    methods: {
      getRecords(){
        let myVar=[]
        myVar.push(recup.record1)
        myVar.push(recup.record2)
        return myVar
      },
      canDisplay(){
          if (recup.collectionRecord1==="bibs" || recup.collectionRecord2==="bibs"){
            return false
          }
          if (recup.isRecordOneDisplayed && recup.isRecordTwoDisplayed) {
            return true
          } 
          if (!recup.isRecordOneDisplayed && !recup.isRecordTwoDisplayed) {
            return false
          }
      },
      callChangeStyling(myText, myStyle) {
        this.$root.$refs.messagecomponent.changeStyling(myText, myStyle)
      },
  
      getIdFromRecordId(recId) {
        this.id = this.$root.$refs.basketcomponent.getId(recId)
      }
      ,
      removeFromBasket(recId) {
        this.getIdFromRecordId(recId)
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
          this.callChangeStyling("Record removed from the editor", "row alert alert-success")
        }
        if (recordID === "record2") {
          let myDiv = document.getElementById("record2")
          // remove the div
          myDiv.children[1].remove()
          // reset the parameters
          this.record2 = ""
          this.isRecordTwoDisplayed = false
          this.callChangeStyling("Record removed from the editor", "row alert alert-success")
        }
      },
      async displayMarcRecord(myRecord, myColl="bibs") {
        /* To do: update the location bar/route to indicate the presence/order of record collection/id pairs */
  
        console.log("Collection: " + myColl)
        // console.log(myRecord)
        // console.log(this.prefix)
  
        Jmarc.apiUrl = this.prefix
  
        let display = { "display1": myRecord };
  
        for (let [div, recId] of Object.entries(display)) {
          Jmarc.get(myColl, recId).then(
            bib => {
              let table = document.createElement("table");
  
              // some styling for the table
              table.style.width="400px";
              table.style.tableLayout = "fixed";
              table.className="w-auto table-striped"
  
              // let saveCell = idRow.insertCell();
              // let saveButton = document.createElement("input");
              // saveCell.appendChild(saveButton);
              // saveButton.type = "button";
              // saveButton.value = "save";
              // saveButton.className = "btn btn-outline-primary"

              // Save Button
              let idRow = table.insertRow();
              let idCell = idRow.insertCell();
              idCell.colSpan = 3;
              idCell.innerHTML = "<strong> " + myColl + "/" + recId + "</strong>";
  
              let saveCell = idRow.insertCell();
              let saveButton = document.createElement("input");
              saveCell.appendChild(saveButton);
              saveButton.type = "button";
              saveButton.value = "save";
              saveButton.className = "btn btn-outline-primary"
              saveButton.onclick = () => {
                try
                {
                  bib.put()
                  this.callChangeStyling("Record " + recId + " has been updated/saved", "row alert alert-success")
                }
                catch (error){
                  this.callChangeStyling(error.message,"row alert alert-danger")
                }

              };

              // clone record
  
              let cloneCell = idRow.insertCell();
              let cloneButton = document.createElement("input");
              cloneCell.appendChild(cloneButton);
              cloneButton.type = "button";
              cloneButton.value = "clone";
              cloneButton.className = "btn btn-outline-warning"
              cloneButton.onclick = () => {
                let recup=bib.clone()
                try
                {
                  recup.post()
                  this.callChangeStyling("Record " + recId + " has been cloned", "row alert alert-success")
                }
                catch (error){
                  this.callChangeStyling(error.message,"row alert alert-danger")
                }              
              };
  
              // Delete button
              let deleteCell = idRow.insertCell();
              let deleteButton = document.createElement("input");
              deleteCell.appendChild(deleteButton);
              deleteButton.type = "button";
              deleteButton.value = "delete";
              deleteButton.className = "btn btn-outline-danger"
              deleteButton.onclick = () => {
                try
                {
                  bib.delete()
                  if (this.record1 === String(recId)) {
                    this.removeRecordFromEditor("record1")
                  }
                  if (this.record2 === String(recId)) {
                    this.removeRecordFromEditor("record2")
                  }
                this.callChangeStyling("Record " + recId + " has been deleted", "row alert alert-success")
                this.removeFromBasket(recId)                  
                }
                catch (error){
                this.callChangeStyling(error.message,"row alert alert-danger")
                }  
              };

              // history record

              // let historyCell = idRow.insertCell();
              // let historyButton = document.createElement("select");
              // historyCell.appendChild(historyButton);
              // historyButton.type = "button";
              // historyButton.value = "clone";
              // historyButton.className = "btn btn-outline-warning"
              // historyButton.onclick = () => {
              // //
              // };

              for (let field of bib.fields.sort((a, b) => parseInt(a.tag) - parseInt(b.tag))) {
                let row = table.insertRow();
  
                let tagCell = row.insertCell();
                tagCell.innerHTML = field.tag;
  
                if (field.constructor.name == "ControlField") {
                  // controlfield
                  row.insertCell(); // placeholder
  
                  let valCell = row.insertCell();
                  valCell.innerHTML = field.value;
                } else {
                  // datafield
                  for (let subfield of field.subfields) {
                    let subRow = table.insertRow()
                    subRow.insertCell(); // placeholder
  
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
  
                    if (bib.isAuthorityControlled(field.tag, subfield.code)) {
                      valSpan.className = "authority-controlled"; // for styling
  
                      // xref
                      let xrefCell = subRow.insertCell();
                      subfield.xrefElement = xrefCell; // save the xref HTML element in the subfield object
                      //xrefCell.innerHTML = subfield.xref;
                      let xrefLink = document.createElement("a");
                      xrefCell.appendChild(xrefLink);
                      xrefLink.text = subfield.xref;
                      xrefLink.href = `${Jmarc.apiUrl}marc/auths/records/${subfield.xref}?format=mrk`;
                      xrefLink.target="_blank"
  
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
                                      popup.innerHTML = "not found :(";
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
                                      )
  
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
                                      )
                                    }
                                  }
                                )
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
              table.style.marginTop="5px"
              if (this.isRecordOneDisplayed == false) {
                let myRecord1 = document.getElementById("record1");
                myRecord1.appendChild(table)
                this.isRecordOneDisplayed = true
                this.record1 = myRecord
                // further styling for the div
                if (myColl==="bibs") {
                   console.log("ici")
                   table.style.border="2px solid green";    
                } else {
                  table.style.border="2px solid purple";    
                }
              }
              else if
                (this.isRecordTwoDisplayed == false) {
                let myRecord2 = document.getElementById("record2");
                myRecord2.appendChild(table)
                this.isRecordTwoDisplayed = true
                this.record2 = myRecord
                // further styling for the div
                if (myColl==="bibs") {
                  this.collectionRecord1="bibs"
                  table.style.border="3px solid green";    
                } else {
                  this.collectionRecord1="auths"
                  table.style.border="3px solid purple";    
                }
              }
  
  
              // myRecord.appendChild(table);
              // myRecord.id = "record"+myRecord.recId;
            }
  
          );
  
        }
  
      }
     }
  }

//export { multiplemarcrecordcomponent }