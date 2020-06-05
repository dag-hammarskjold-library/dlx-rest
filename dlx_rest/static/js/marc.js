// Class for the component
class MarcRecord extends HTMLElement {

    // invoke the constructor  
    constructor() {

        super();

        // Definition of the id of the component
        this.heigth = "1000px";
        this.width = "1000px";
        this.id = "marc-record";
        this.recordNumber = "";
        this.recordType = "";
        this.myToken = this.getToken();
        this.url = ""
        this.tableNewRecordCreated = false;
        this.rowLineNewRecord = 0;
        this.prefixUrl = "https://czwkm00smd.execute-api.us-east-1.amazonaws.com/dev/api/";
        this.editMode = "False";
        this.idToUpdate = "";
        this.typeRecordToUpdate = "";
        this.rowselected = 0;
    };

    // create the hidden Modal form
    createhiddenModalForm() {
        // creation of the modal
        this.innerHTML = "<div id='myModal' class='modal' tabindex='-1' role='dialog'> " +
            "<div class='modal-dialog' role='document'> " +
            "  <div class='modal-content'> " +
            "    <div class='modal-header'> " +
            "      <div id='modalTitle' class='modal-title'> myTitle </div> " +
            "      <button type='button' class='close' data-dismiss='modal' aria-label='Close'> " +
            "        <span aria-hidden='true'>&times;</span> " +
            "      </button> " +
            "    </div> " +
            "     <div class='modal-body'> " +
            "      <div id='modalContent'>  myContent  </div> " +
            "    </div> " +
            "    <div class='modal-footer'> " +
            "      <button id='modalClose' type='button' class='btn btn-secondary' data-dismiss='modal'>Close</button> " +
            "      <button id='modalButton' type='button' class='btn btn-primary'> myButtonLabel  </button> " +
            "    </div>" +
            "  </div>" +
            " </div>" +
            " </div> ";
    }

    // creatio of the external script of the component
    createScript() {

        // Adding the function to add a new code/subfield value
        const myScript = document.createElement("SCRIPT");
        const inlineScript = document.createTextNode("function ylsAlert(){alert('gloire a Dieu')};");
        myScript.appendChild(inlineScript);
        this.appendChild(myScript);

        // Adding the function to delete a new code/subfield value

    }

    // function fetching the data from the API
    async getDataFromApi(url) {
        this.url = url;
        let response = await fetch(url);
        if (response.ok) { // if HTTP-status is 200-299
            // get the response body (the method explained below)
            let json = await response.json();
            let resultsList = Object.keys(json["result"]);
            let resultsSize = resultsList.length;
            let results = json["result"];
            divMailHeader.innerHTML = "";
            this.displayDataFromApi(resultsList, resultsSize, results);
        } else {
            return divMailHeader.innerHTML = "<div class='alert alert-danger mt-2 alert-dismissible fade show' role='alert'>Something is wrong, HTTP-Error number : " + response.status + "</div>";
        }
    }

    // call the API for deletion
    async deleteDataFromApi(userName, userPassword, recordType, recordID) {

        let username = userName;
        let password = userPassword;
        let myString = this.prefixUrl + recordType + '/' + recordID;
        let encodedString = window.btoa(username + ":" + password);
        let auth = "Basic " + encodedString;

        fetch(myString, {
            method: 'DELETE',
            headers: new Headers({
                'Accept': 'application/json',
                "Authorization": auth
            })
        }).then(response => {
            if (response.ok) {
                // display the mail
                divMailHeader.innerHTML = "<div class='alert alert-success mt-2 alert-dismissible fade show' role='alert'>New record deleted!</div>";
                //refresh the page
                setTimeout(location.reload(), 2000);
            } else {
                return divMail.innerHTML = "<div class='alert alert-danger mt-2 alert-dismissible fade show' role='alert'>Something is wrong " + response.status + "</div>";
            }
        })
    }

    // call the API for creation
    async createRecord(url, data) {
        //async createRecord(url){

        let username = "dev_admin@un.org";
        let password = "password";
        let encodedString = window.btoa(username + ":" + password);
        let auth = "Basic " + encodedString;

        fetch(url, {
            method: 'POST',
            headers: new Headers({
                "Content-Type": "application/json",
                "Authorization": auth
            }),
            body: data
        }).then(response => {
            if (response.ok) {
                // display the mail
                divMailHeader.innerHTML = "<div class='alert alert-success mt-2 alert-dismissible fade show' role='alert'>New record created!</div>";
                console.log(response.status)
                    //refresh the page
                setTimeout(location.reload(), 10000);
            } else {
                return divMailHeader.innerHTML = "<div class='alert alert-danger mt-2 alert-dismissible fade show' role='alert'>Something is wrong " + response.text().then(text => { throw new Error(text) }) + "</div>";
                setTimeout(location.reload(), 10000);
            }
        })
    }


    // call the API for creation
    async updateRecord(url, data) {
        //async createRecord(url){

        let username = "dev_admin@un.org";
        let password = "password";
        let encodedString = window.btoa(username + ":" + password);
        let auth = "Basic " + encodedString;

        fetch(url, {
            method: 'PUT',
            headers: new Headers({
                "Content-Type": "application/json",
                "Authorization": auth
            }),
            body: data
        }).then(response => {
            if (response.ok) {
                // display the mail
                divMailHeader.innerHTML = "<div class='alert alert-success mt-2 alert-dismissible fade show' role='alert'>New record updated!</div>";
                console.log(response.status)
                    //refresh the page
                setTimeout(location.reload(), 10000);
            } else {
                return divMailHeader.innerHTML = "<div class='alert alert-danger mt-2 alert-dismissible fade show' role='alert'>Something is wrong " + response.text().then(text => { throw new Error(text) }) + "</div>";
                setTimeout(location.reload(), 10000);
            }
        })
    }

    // remove a div from the page
    removeDiv(name) {
        this.removeChild(name);
    }

    // create the record form
    createFrameNewRecord() {


        this.tableNewRecordCreated = true;

        //--->create data table > start
        var tbl = '';
        tbl += '<table id="tableNewRecord" class="table table-hover">'

        //--->create table header > start
        tbl += '<thead>';
        tbl += '<tr>';
        tbl += '<th><span class="badge badge-secondary">#</span></th>';
        tbl += '<th><span class="badge badge-secondary">TAG</span></th>';
        tbl += '<th><span class="badge badge-secondary">IND1 </span></th>';
        tbl += '<th><span class="badge badge-secondary">IND2 </span></th>';
        tbl += '<th><span class="badge badge-secondary">VALUE</span></th>';
        tbl += '</tr>';
        tbl += '</thead>';


        // Create a new line in the table

        tbl += '<tbody id=tbodyNewLine>'

        this.rowLineNewRecord++;
        let row_id = this.rowLineNewRecord;

        // creation of the header of the table

        tbl += '<tr id="' + row_id + '">';
        tbl += '<td ><div style="display: table;" class="tagClass mt-0" col_name="tagCol" contenteditable="true"> <input class="myCheckbox" id="checkboxCol' + row_id + '" type="checkbox" placeholder="Tag" maxlength="3" size="3"></div></td>';
        tbl += '<td ><div style="display: table;" class="tagClass mt-0" col_name="tagCol" contenteditable="true"> <input id="tagCol' + row_id + '" type="text"  min="000" max="999" placeholder="Tag" maxlength="3" size="3"></div></td>';
        tbl += '<td ><div style="display: table;" class="indClass" col_name="ind1Col" contenteditable="true"><select class="mt-1" id="ind1Col' + row_id + '"><option value="0">0</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> <option value="6">6</option> <option value="7">7</option> <option value="8">8</option><option value="9">9</option></select></div></td>';
        tbl += '<td ><div style="display: table;" class="indClass" col_name="ind2Col" contenteditable="true"><select class="mt-1" id="ind2Col' + row_id + '"><option value="0">0</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> <option value="6">6</option> <option value="7">7</option> <option value="8">8</option><option value="9">9</option></select></div></td>';
        tbl += '<td><div id="divData' + row_id + '" style="display: table;" class="valueClass " col_name="valueCol" contenteditable="true"><div><select class="mr-2" id="code' + row_id + '"><option value="a">a</option> <option value="b">b</option> <option value="c">c</option> <option value="d">d</option> <option value="e">e</option> <option value="f">f</option> <option value="g">g</option> <option value="h">h</option> <option value="i">i</option> <option value="j">j</option> <option value="k">k</option> <option value="l">l</option> <option value="m">m</option> <option value="n">n</option> <option value="o">o</option> <option value="p">p</option> <option value="q">q</option> <option value="r">r</option> <option value="s">s</option> <option value="t">t</option> <option value="u">u</option> <option value="v">v</option><option value="w">w</option> <option value="x">x</option> <option value="y">y</option><option value="z">z</option></select><input size="80" id="value' + row_id + '" type="text" placeholder="Value"></div></div></td>';

        // end of the line

        tbl += '</tr>';

        // end of the body of the table

        tbl += '</tbody>';

        // end of the table

        tbl += '</table>'

        // Adding the HR line

        tbl += '<hr>'

        // Adding a div with the number of line created for the record
        tbl += "<div ><span id='valNumLineNewRecord' >" + this.rowLineNewRecord + "</span> line(s) created for this record </div>"

        // check if the div content is already created 

        let divContent = document.getElementById("divContent");
        if (divContent !== null) {
            //this.removeDiv(divContent);
            divContent.innerHTML = " ";
        }

        // check if the div detail is already created 
        let divDetail = document.getElementById("divDetail");
        if (divDetail !== null) {
            //this.removeDiv(divDetail);
            divDetail.innerHTML = " ";
        }

        // check if the div newRecord is already created 
        let divNewRecord = document.getElementById("divNewRecord");
        if (divNewRecord !== null) {
            divNewRecord.innerHTML = " ";
            //this.removeDiv(divNewRecord);
        }

        // create the div for the data
        if (divNewRecord === null) {
            divNewRecord = document.createElement("DIV");
            divNewRecord.id = "divNewRecord";
        }

        //divNewRecord.appendChild(table);

        divNewRecord.innerHTML = tbl;
        this.appendChild(divNewRecord);
    }
    setModalWindos(myClass, myTitle, MyContent, myBtnLbl) {
        document.getElementById("modalTitle").innerHTML = `<div class='"+${myClass}+"' role='alert'> "+${myTitle}+"</div>`;
        document.getElementById("modalContent").innerHTML = `<div class='form-group'><label for='modalUrl'>"+${myBtnLbl}+"</label><input type='text' class='form-control' id='modalUrl'></div>`;
        let myButtonHeader = document.getElementById("modalButton");
        myButtonHeader.innerHTML = `${myBtnLbl}`;
    };

    addNewLineRecord(row_id) {

        if (this.tableNewRecordCreated == true) {
            this.rowLineNewRecord++;
            let row_id = this.rowLineNewRecord;
            const myTable = document.getElementById("tableNewRecord");
            let NewRow = myTable.insertRow(-1);
            NewRow.id = row_id;
            let cell0 = NewRow.insertCell(0);
            let cell1 = NewRow.insertCell(1);
            let cell2 = NewRow.insertCell(2);
            let cell3 = NewRow.insertCell(3);
            let cell4 = NewRow.insertCell(4);
            cell0.innerHTML = '<div style="display: table;" class="tagClass mt-0" col_name="tagCol" contenteditable="true"> <input class="myCheckbox" id="checkboxCol' + row_id + '" type="checkbox" placeholder="Tag" maxlength="3" size="3"></div>';
            cell1.innerHTML = '<div style="display: table;" class="tagClass mt-0" col_name="tagCol" contenteditable="true"> <input id="tagCol' + row_id + '" type="text" min="001" max="999" placeholder="Tag" maxlength="3" size="3"></div>';
            cell2.innerHTML = '<div style="display: table;" class="indClass" col_name="ind1Col" contenteditable="true"><select class="mt-1" id="ind1Col' + row_id + '"><option value="0">0</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> <option value="6">6</option> <option value="7">7</option> <option value="8">8</option><option value="9">9</option></select></div>';
            cell3.innerHTML = '<div style="display: table;" class="indClass" col_name="ind2Col" contenteditable="true"><select class="mt-1" id="ind2Col' + row_id + '"><option value="0">0</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> <option value="6">6</option> <option value="7">7</option> <option value="8">8</option><option value="9">9</option></select></div>';
            cell4.innerHTML = '<div id="divData' + row_id + '" style="display: table;" class="valueClass" col_name="valueCol" contenteditable="true"><div><select class="mr-2" id="code' + row_id + '"><option value="a">a</option> <option value="b">b</option> <option value="c">c</option> <option value="d">d</option> <option value="e">e</option> <option value="f">f</option> <option value="g">g</option> <option value="h">h</option> <option value="i">i</option> <option value="j">j</option> <option value="k">k</option> <option value="l">l</option> <option value="m">m</option> <option value="n">n</option> <option value="o">o</option> <option value="p">p</option> <option value="q">q</option> <option value="r">r</option> <option value="s">s</option> <option value="t">t</option> <option value="u">u</option> <option value="v">v</option><option value="w">w</option> <option value="x">x</option> <option value="y">y</option><option value="z">z</option></select><input size="80" id="value' + row_id + '" type="text" placeholder="Value"></div></div>';
            this.updateNumberOfLineRecord();
        } else {
            alert("Please create a new the record first!!!");
        }


    }

    removeLastLineRecord() {
        if (this.tableNewRecordCreated == true && (this.rowLineNewRecord > 1)) {
            const myTable = document.getElementById("tableNewRecord")
            myTable.deleteRow(-1);
            this.rowLineNewRecord = this.rowLineNewRecord - 1;
            this.updateNumberOfLineRecord();
        } else {
            alert("Please create a new the record first!!!");
        }
    }

    // Add a new subfieldLine
    addNewSubFieldLine() {
        if (this.tableNewRecordCreated == true || this.editMode === "True") {
            let checkButton = false;

            // Retrieving the table
            const myTable = document.getElementById("tableNewRecord");

            // Retrieving all the checkbox
            const myCheckbox = myTable.getElementsByClassName("myCheckbox");

            //Loop through the CheckBoxes.
            for (var i = 0; i < myCheckbox.length; i++) {
                if (myCheckbox[i].checked) {
                    checkButton = true;
                    let row = myCheckbox[i].parentNode.parentNode.parentNode;
                    let myId = "divData" + row.rowIndex;
                    let myTd = document.getElementById(myId);
                    //myTd.insertAdjacentHTML('beforeend','<div style="display: table;" class="valueClass" col_name="valueCol" contenteditable="true"><select class="mr-2" id="code'+ row.rowIndex +' "><option value="a">a</option> <option value="b">b</option> <option value="c">c</option> <option value="d">d</option> <option value="e">e</option> <option value="f">f</option> <option value="g">g</option> <option value="h">h</option> <option value="i">i</option> <option value="j">j</option> <option value="k">k</option> <option value="l">l</option> <option value="m">m</option> <option value="n">n</option> <option value="o">o</option> <option value="p">p</option> <option value="q">q</option> <option value="r">r</option> <option value="s">s</option> <option value="t">t</option> <option value="u">u</option> <option value="v">v</option><option value="w">w</option> <option value="x">x</option> <option value="y">y</option><option value="z">z</option></select><input size="80" id="value'+ row.rowIndex +' " type="text" placeholder="Value"></div>');    
                    myTd.insertAdjacentHTML('beforeend', '<div><select class="mr-2"><option value="a">a</option> <option value="b">b</option> <option value="c">c</option> <option value="d">d</option> <option value="e">e</option> <option value="f">f</option> <option value="g">g</option> <option value="h">h</option> <option value="i">i</option> <option value="j">j</option> <option value="k">k</option> <option value="l">l</option> <option value="m">m</option> <option value="n">n</option> <option value="o">o</option> <option value="p">p</option> <option value="q">q</option> <option value="r">r</option> <option value="s">s</option> <option value="t">t</option> <option value="u">u</option> <option value="v">v</option><option value="w">w</option> <option value="x">x</option> <option value="y">y</option><option value="z">z</option></select><input size="80" type="text" placeholder="Value"></div>');
                }
            }
            if (checkButton == false) {
                alert("Please check a tag first!!!");
            }
        } else {
            alert("Please create a new the record first or Edit an old record!!!");
        }
    }

    // Remove a new subfieldLine
    delNewSubFieldLine() {
        if (this.tableNewRecordCreated == true) {
            // Retrieving the table
            const myTable = document.getElementById("tableNewRecord");

            // Retrieving all the checkbox
            const myCheckbox = myTable.getElementsByClassName("myCheckbox");

            //Loop through the CheckBoxes.
            for (var i = 0; i < myCheckbox.length; i++) {

                if (myCheckbox[i].checked) {
                    let row = myCheckbox[i].parentNode.parentNode.parentNode;
                    let myId = "divData" + row.rowIndex;
                    let myTd = document.getElementById(myId);

                    if (myTd.childElementCount > 1) {
                        myTd.removeChild(myTd.lastElementChild);
                    }
                }
            }
        }
    }


    // Retrieving the table
    generateDataToSave() {

        // my data variable
        let myRecord = [];
        let mySpecialRecord = "{";
        //let myTagLine={};
        let myTag = []
        let myInd1 = []
        let myInd2 = []
        let myListOfSubField = "[";
        let myData = "";
        let recup = "";

        // Retrieving the table
        const myTable = document.getElementById("tableNewRecord");

        // Retrieving all the rows
        const totalRow = myTable.getElementsByTagName("TR");
        // console.log(totalRow)

        for (var i = 1, row; row = myTable.rows[i]; i++) {


            // Retrieving tag data
            myTag = document.getElementById("tagCol" + i).value;

            // Retrieving ind1 data
            myInd1 = document.getElementById("ind1Col" + i).value;

            // Retrieving ind2 data
            myInd2 = document.getElementById("ind2Col" + i).value;

            // Retrieving Subfield data
            let myData = document.getElementById("divData" + i).getElementsByTagName("DIV");

            let lenMyData = myData.length;

            let mySubField = "";

            for (var j = 0; j < lenMyData; j++) {
                let myCode = myData[j].getElementsByTagName("SELECT")[0].value;
                console.log("le code est  :" + myCode)

                let myValue = myData[j].getElementsByTagName("INPUT")[0].value;
                console.log("la valeur est  :" + myValue)


                // Definition of the dict to store the subfields
                if (j === (lenMyData - 1)) {
                    //myListOfSubField = myListOfSubField +`{"code": "${myCode}","value": "${myValue}"}` ;
                    myListOfSubField = myListOfSubField + `{"code": "${myCode}","value": "${myValue}"}`;
                } else {
                    myListOfSubField = myListOfSubField + `{"code": "${myCode}","value": "${myValue}"}` + ",";
                }

            }

            // close the subfield string
            myListOfSubField = myListOfSubField + "]";
            console.log(myListOfSubField)

            if (i === (totalRow.length - 1)) {
                mySpecialRecord = mySpecialRecord + `"${myTag}":[{"indicators":["${myInd1}","${myInd2}"],"subfields": ${myListOfSubField}` + "}]}";
            } else {
                mySpecialRecord = mySpecialRecord + `"${myTag}":[{"indicators":["${myInd1}","${myInd2}"],"subfields": ${myListOfSubField}` + "}],";
            }

            myListOfSubField = "[";

        }

        console.log(mySpecialRecord)

        // Retrieving the value of the type of Record

        const typeRecord = document.getElementById("selectTypeRecord").value;

        // Saving the Data
        let data = mySpecialRecord;

        this.createRecord(this.prefixUrl + typeRecord, data)

    }

    // Retrieving the table
    generateDataToUpdate() {

        // my data variable
        let myRecord = [];
        let mySpecialRecord = '{"_id": ' + this.idToUpdate + ', ';
        //let myTagLine={};
        let myTag = []
        let myInd1 = []
        let myInd2 = []
        let myListOfSubField = "[";
        let myData = "";
        let recup = "";

        // Retrieving the table
        const myTable = document.getElementById("tableNewRecord");

        // Retrieving all the rows
        const totalRow = myTable.getElementsByTagName("TR");
        // console.log(totalRow)

        for (var i = 1, row; row = myTable.rows[i]; i++) {


            // Retrieving tag data
            myTag = document.getElementById("tagCol" + i).value;

            // Retrieving ind1 data
            myInd1 = document.getElementById("ind1Col" + i).value;

            // Retrieving ind2 data
            myInd2 = document.getElementById("ind2Col" + i).value;

            // Retrieving Subfield data
            let myData = document.getElementById("divData" + i).getElementsByTagName("DIV");

            let lenMyData = myData.length;

            let mySubField = "";

            for (var j = 0; j < lenMyData; j++) {
                let myCode = myData[j].getElementsByTagName("SELECT")[0].value;
                console.log("le code est  :" + myCode)

                let myValue = myData[j].getElementsByTagName("INPUT")[0].value;
                console.log("la valeur est  :" + myValue)


                // Definition of the dict to store the subfields
                if (j === (lenMyData - 1)) {
                    //myListOfSubField = myListOfSubField +`{"code": "${myCode}","value": "${myValue}"}` ;
                    myListOfSubField = myListOfSubField + `{"code": "${myCode}","value": "${myValue}"}`;
                } else {
                    myListOfSubField = myListOfSubField + `{"code": "${myCode}","value": "${myValue}"}` + ",";
                }

            }

            // close the subfield string
            myListOfSubField = myListOfSubField + "]";
            console.log(myListOfSubField)

            if (i === (totalRow.length - 1)) {
                mySpecialRecord = mySpecialRecord + `"${myTag}":[{"indicators":["${myInd1}","${myInd2}"],"subfields": ${myListOfSubField}` + "}]}";
            } else {
                mySpecialRecord = mySpecialRecord + `"${myTag}":[{"indicators":["${myInd1}","${myInd2}"],"subfields": ${myListOfSubField}` + "}],";
            }

            myListOfSubField = "[";

        }

        console.log(mySpecialRecord)

        // Retrieving the value of the type of Record

        const typeRecord = this.typeRecordToUpdate;
        // Saving the Data
        let data = mySpecialRecord;

        this.updateRecord(this.prefixUrl + typeRecord + "/" + this.idToUpdate, data)
            //this.updateRecord(this.prefixUrl + typeRecord + "/1", data)

        // cleaning 
        this.typeRecordToUpdate = "";
        this.idToUpdate = "";

        // showing the save button
        var btn = document.getElementById("btnSaveRecord")
        btn.style.display = "block";

    }


    // update the number of lines variable

    updateNumberOfLineRecord() {
        // check if the div detail is already created 
        let myNumber = document.getElementById("valNumLineNewRecord");
        if (myNumber !== null) {
            // assign the new value of the variable
            myNumber.innerHTML = this.rowLineNewRecord;
        }
    }

    // get the ID of the record
    getRecordType(url) {
        if (url) {
            let letter = (url.substring(63, 64));
            return (letter === "a") ? "auths" : "bibs";
        } else {
            return "N/A"
        }
    }

    // get the ID of the record
    getRecordID() {
        return this.recordNumber;
    }

    // get the url of the record first load
    getUrlAPI() {
        return this.getAttribute('url');
    }

    // get the token value
    getToken() {
        return this.getAttribute('token');
    }

    setUrlAPI(myUrlApi) {
        // Reflect the value of the open property as an HTML attribute.
        if (myUrlApi) {
            this.setAttribute('name', 'myUrlApi');
        } else {
            this.setAttribute('name', 'not defined');
        }
    }

    createHeaderComponent() {

        /////////////////////////////////////////////////////////////////////////////////
        // creation of the header of the component
        /////////////////////////////////////////////////////////////////////////////////

        let that = this;

        // create the div for the _id
        let divHeader = document.createElement("DIV");
        divHeader.innerHTML = "<h3> MARC EDITOR version 1.0 </h3> ";

        // Adding the name of the div
        divHeader.setAttribute("id", "divHeader");

        // Adding the style
        divHeader.className = "mt-3 mb-3 text-left text-success";

        // Adding the div to the page
        this.appendChild(divHeader);

        // create the div for the data
        let divContentHeader = document.createElement("DIV");
        divContentHeader.id = "divContentHeader";
        this.appendChild(divContentHeader);

        // create the div for the mail
        let divMailHeader = document.createElement("DIV");
        divMailHeader.id = "divMailHeader";
        this.appendChild(divMailHeader);

        let isToken = this.getToken();

        if (isToken !== "") {

            // Display the button for the displaying a new record
            let btnDisplayNewRecordHeader = document.createElement("BUTTON");
            btnDisplayNewRecordHeader.className = "btn btn-secondary mr-2 mb-2";
            btnDisplayNewRecordHeader.id = "btnDisplayNewRecord";
            btnDisplayNewRecordHeader.innerHTML = "Display a new record";
            divContentHeader.appendChild(btnDisplayNewRecordHeader);

            btnDisplayNewRecordHeader.setAttribute('data-toggle', 'modal');
            btnDisplayNewRecordHeader.setAttribute('data-target', '#myModal');

            // adding the logic to call the new url
            btnDisplayNewRecordHeader.addEventListener("click", () => {
                document.getElementById("modalTitle").innerHTML = "<div class='alert alert-success mt-2' role='alert'>Display one record</div>";
                document.getElementById("modalContent").innerHTML = "<div class='form-group'><label for='modalUrl'>Please insert the url of the record</label><input type='text' class='form-control' id='modalUrl'></div>";
                let myButtonHeader = document.getElementById("modalButton");
                myButtonHeader.innerHTML = "Display";
            });

            document.getElementById("modalButton").addEventListener("click", () => {
                let myVal = document.getElementById("modalUrl");
                if (myVal) {
                    this.getDataFromApi(myVal.value);
                }
                document.getElementById("modalClose").click();
            })

            // create the button for a new record

            let btnCreateNewRecord = document.createElement("BUTTON");
            btnCreateNewRecord.className = "btn btn-primary mr-2 mb-2";
            btnCreateNewRecord.id = "btnDisplayNewRecord";
            btnCreateNewRecord.innerHTML = "Create a new record";
            divContentHeader.appendChild(btnCreateNewRecord);

            // adding the logic to call the new url
            btnCreateNewRecord.addEventListener("click", () => {

                let divRecordType = document.getElementById("divRecordType");

                if (divRecordType == null) {
                    let myHtml = document.createElement("DIV");
                    myHtml.innerHTML = `<select class="custom-select" id="selectTypeRecord" style="width: 300px;">
                                        <!--<option selected>Please select the record type</option>->
                                        <option value="bibs" selected>Bibliographic record</option>
                                        <option value="auths">Authority Record</option>
                                </select>`
                    myHtml.id = "divRecordType"
                    myHtml.className = "mr-2 mb-2";
                    divContentHeader.appendChild(myHtml);
                }

                if (divRecordType !== null) {
                    divRecordType.innerHTML = `<select class="custom-select" id="selectTypeRecord" style="width: 300px;">
                            
                                        <option value="bibs" selected>Bibliographic record</option>
                                        <option value="auths">Authority Record</option>
                                </select>`
                }

                const myDiv = document.getElementById("divNewRecord");
                if (myDiv) {
                    this.removeDiv(myDiv);
                    this.tableNewRecordCreated = false;
                    this.rowLineNewRecord = 0;
                }
                this.createFrameNewRecord();
            });

            // create the button for adding a new line for the record

            let btnAddingNewLine = document.createElement("BUTTON");
            btnAddingNewLine.className = "btn btn-info mr-2 mb-2";
            btnAddingNewLine.id = "btnAddingNewLine";
            btnAddingNewLine.innerHTML = "<i class='fa fa-plus' aria-hidden='true'> Tag </i>";
            divContentHeader.appendChild(btnAddingNewLine);

            // adding the logic to call the new url
            btnAddingNewLine.addEventListener("click", () => {
                this.addNewLineRecord(this.rowLineNewRecord);
            });

            // create the button for deleting a new line for the record

            let btnDeletingNewLine = document.createElement("BUTTON");
            btnDeletingNewLine.className = "btn btn-info mr-2 mb-2";
            btnDeletingNewLine.id = "btnDeletingNewLine";
            btnDeletingNewLine.innerHTML = "<i class='fa fa-minus' aria-hidden='true'> Tag </i>";
            divContentHeader.appendChild(btnDeletingNewLine);

            // adding the logic to call the new url
            btnDeletingNewLine.addEventListener("click", () => {
                this.removeLastLineRecord();
            });

            // create the button for adding a new subfield

            let btnAddNewSubField = document.createElement("BUTTON");
            btnAddNewSubField.className = "btn btn-info mr-2 mb-2";
            btnAddNewSubField.id = "btnDeletingNewLine";
            btnAddNewSubField.innerHTML = "<i class='fa fa-plus' aria-hidden='true'> Subfield </i>";
            divContentHeader.appendChild(btnAddNewSubField);

            // adding the logic to call the new url
            btnAddNewSubField.addEventListener("click", () => {
                this.addNewSubFieldLine();
            });

            // create the button for deleting a new subfield

            let btnDelNewSubField = document.createElement("BUTTON");
            btnDelNewSubField.className = "btn btn-info mr-2 mb-2";
            btnDelNewSubField.id = "btnDeletingNewLine";
            btnDelNewSubField.innerHTML = "<i class='fas fa-minus' aria-hidden='true'> Subfield </i>";
            divContentHeader.appendChild(btnDelNewSubField);

            // adding the logic to call the new url
            btnDelNewSubField.addEventListener("click", () => {
                this.delNewSubFieldLine();
            });

            // save the record button

            let btnSaveRecord = document.createElement("BUTTON");
            btnSaveRecord.className = "btn btn-success mr-2 mb-2";
            btnSaveRecord.id = "btnSaveRecord";
            btnSaveRecord.innerHTML = "Save the record";
            divContentHeader.appendChild(btnSaveRecord);

            // adding the logic to call the new url
            btnSaveRecord.addEventListener("click", () => {
                this.generateDataToSave();
            });

            // edit record button

            let btnEditRecord = document.createElement("BUTTON");
            btnEditRecord.className = "btn btn-warning mr-2 mb-2";
            btnEditRecord.id = "btnEditRecord";
            btnEditRecord.innerHTML = "Edit the record";
            divContentHeader.appendChild(btnEditRecord);


            // adding the logic to call to edit a record
            btnEditRecord.addEventListener("click", () => {
                this.generateDataToUpdate();
            });


            // Adding the dropdown list to define the type of record
            let myHtml = document.createElement("DIV");
            myHtml.innerHTML = `<select class="custom-select" id="selectTypeRecord" style="width: 300px;">
                                <option value="bibs" selected>Bibliographic record</option>
                                <option value="auths">Authority Record</option>
                        </select>`
            myHtml.id = "divRecordType"
            myHtml.className = "mr-2 mb-2";
            divContentHeader.appendChild(myHtml);
        } else {
            divHeader.innerHTML = "<h3> MARC EDITOR version 1.0 (Unknown User) </h3> ";
        }
    }

    // // return the value of the line
    // getDataLine() {
    //     alert("I clicked a line");
    // }

    // return the value of the line
    getDataLine(tableId, callback) {
        var table = document.getElementById(tableId),
            rows = table.getElementsByTagName("tr"),
            i;
        for (i = 0; i < rows.length; i++) {
            table.rows[i].onclick = function(row) {
                return function() {
                    callback(row);
                };
            }(table.rows[i]);
        }
    }

    // function generating the record with the value from the API
    displayDataFromApi(myDataList, myDataSize, myData) {

            // check if the record is already displayed
            let divNewRecord = document.getElementById("divNewRecord");
            if (divNewRecord !== null) {
                divNewRecord.innerHTML = " ";
            }
            let divRecordType = document.getElementById("divRecordType");
            if (divRecordType !== null) {
                divRecordType.innerHTML = " ";
            }

            // check if the record is already displayed
            //if (this.recordNumber!==myData["_id"]){
            //if (true){

            // loop to display the values
            let md = myDataList.sort();

            /////////////////////////////////////////////////////////////////////////////////
            // creation of the header of the component
            /////////////////////////////////////////////////////////////////////////////////

            // create the div for the _id
            // check if the div is already created if no we can create it
            let divDetail = document.getElementById("divDetail");
            if (divDetail === null) {
                divDetail = document.createElement("DIV");
                // Adding the div to the page
                this.appendChild(divDetail);
            }

            this.recordType = this.getRecordType(this.url);
            // be sure to empty the div
            let recupId = this.getRecordID();

            divDetail.innerHTML = "<h3 class='text-dark'>Record ID : " + myData["_id"] + "  </h3>  <span class='text-dark'>Record Type:  " + this.recordType + "</span>";

            // Adding the ID
            divDetail.id = "divDetail";

            this.recordNumber = myData["_id"];
            this.getRecordID();

            // Adding the style
            divDetail.className = "mt-3 mb-3 text-left text-success";

            // // check if the div is already created if no we can create it
            // let divNewRecord=document.getElementById("divNewRecord");
            // if (divNewRecord!==null){
            //     this.removeChild(divNewRecord);
            //     console.log("removed")
            // }

            // check if the div is already created if no we can create it
            let divContent = document.getElementById("divContent");

            if (divContent !== null) {
                divContent.innerHTML = " ";
            }

            // create the div for the data
            if (divContent === null) {
                divContent = document.createElement("DIV");
                this.appendChild(divContent);
                divContent.id = "divContent";

                // create the div for the mail
                let divMail = document.createElement("DIV");
                divMail.id = "divMail";
                this.appendChild(divMail);
            }

            // create the hr 
            let hr1 = document.createElement("HR");
            divContent.appendChild(hr1);

            // create the button for the deletion
            let btnDeleteRecord = document.createElement("BUTTON");
            btnDeleteRecord.className = "btn btn-danger mr-2";
            btnDeleteRecord.id = "btnDeleteRecord";
            btnDeleteRecord.innerHTML = "Delete this record";
            if (this.myToken) {
                divContent.appendChild(btnDeleteRecord);
            }
            btnDeleteRecord.setAttribute('data-toggle', 'modal');
            btnDeleteRecord.setAttribute('data-target', '#myModal');

            // adding the logic to delete a record
            btnDeleteRecord.addEventListener("click", () => {
                document.getElementById("modalTitle").innerHTML = "<div class='alert alert-danger mt-2' role='alert'>Delete the record</div>";
                document.getElementById("modalContent").innerHTML = "Be careful, you are about to delete the record with the ID :   <strong>" + this.getRecordID() + "</strong>";
                let myButton = document.getElementById("modalButton");
                myButton.innerHTML = "Delete";
                myButton.addEventListener("click", () => {
                    this.deleteDataFromApi("dev_admin@un.org", "password", this.recordType, this.recordNumber);
                    document.getElementById("modalClose").click();
                })
            })

            // adding a new hr 
            let hr2 = document.createElement("HR");
            divContent.appendChild(hr2);

            /////////////////////////////////////////////////////////////////////////////////
            // creation of the header of the table
            /////////////////////////////////////////////////////////////////////////////////

            // creation of the html tags

            let table = document.createElement("TABLE");
            let thead = document.createElement("THEAD");
            let tr = document.createElement("TR");
            let th1 = document.createElement("TH");
            let th2 = document.createElement("TH");
            let th3 = document.createElement("TH");
            let th4 = document.createElement("TH");
            let th5 = document.createElement("TH");

            // add the tags to the parent

            tr.appendChild(th1);
            tr.appendChild(th2);
            tr.appendChild(th3);
            tr.appendChild(th4);
            tr.appendChild(th5);

            thead.appendChild(tr);
            table.appendChild(thead);

            // some styling for the header
            thead.className = "thead-light";
            table.className = "table-sm";
            table.id = "tableData"

            // add the values of the columns
            th1.innerHTML = "<span class='badge badge-secondary'> TAG </span>";
            th2.innerHTML = "<span class='badge badge-secondary'> IND1 </span>";
            th3.innerHTML = "<span class='badge badge-secondary'> IND2 </span>";
            th4.innerHTML = "<span class='badge badge-secondary'> VALUE </span>";
            if (this.myToken) {
                th5.innerHTML = "<span class='badge badge-secondary dataProvider'> EDIT </span>";
            }

            divContent.appendChild(table);
            this.appendChild(divContent);
            this.appendChild(divDetail);


            /////////////////////////////////////////////////////////////////////////////////
            // Loop the records and build the table
            /////////////////////////////////////////////////////////////////////////////////

            for (let i = 0; i < myDataSize; i++) {
                let newIndex = i;

                // Display the metadata part
                if ((myDataList[i] !== "_id") && (myDataList[i] < "029")) {

                    let tr = document.createElement("TR");
                    let th1 = document.createElement("TH");
                    let th2 = document.createElement("TH");
                    let th3 = document.createElement("TH");
                    let th4 = document.createElement("TH");
                    let th5 = document.createElement("TH");

                    th1.innerHTML = "<span class='badge badge-pill badge-secondary'>" + myDataList[i] + "</span>";
                    th2.innerHTML = "N/A";
                    th3.innerHTML = "N/A";
                    th4.innerHTML = myData[myDataList[i]];
                    if (this.myToken) {
                        th5.innerHTML = "<span class='badge badge-pill badge-warning dataProvider'><i class='fas fa-edit'>  </i></span>";
                    }

                    tr.appendChild(th1);
                    tr.appendChild(th2);
                    tr.appendChild(th3);
                    tr.appendChild(th4);
                    tr.appendChild(th5);
                    thead.appendChild(tr);
                    table.appendChild(thead);

                }

                // Display the subfield part
                if (parseInt(myDataList[i], 10) >= 29) {
                    let numOccur = myData[myDataList[i]].length;
                    for (let j = 0; j < myData[myDataList[i]].length; j++) {

                        let tr = document.createElement("TR");
                        let th1 = document.createElement("TH");
                        let th2 = document.createElement("TH");
                        let th3 = document.createElement("TH");
                        let th4 = document.createElement("TH");
                        let th5 = document.createElement("TH");


                        let val1 = (myData[myDataList[i]][j]["indicators"][0] !== " ") ? myData[myDataList[i]][j]["indicators"][0] : " _ ";
                        let val2 = (myData[myDataList[i]][j]["indicators"][1] !== " ") ? myData[myDataList[i]][j]["indicators"][1] : " _ ";
                        th1.innerHTML = "<span class='badge badge-pill badge-secondary'>" + myDataList[i] + "</span>";
                        th2.innerHTML = val1;
                        th3.innerHTML = val2;


                        // retrieve the number of subfields
                        let numberSubfield = myData[myDataList[i]][j]["subfields"].length;

                        for (let k = 0; k < numberSubfield; k++) {
                            // loop for the subfields
                            // Management of the xref
                            if (myData[myDataList[i]][j]["subfields"][k]["value"]) {
                                th4.innerHTML += "<span class='text-primary'>$" + myData[myDataList[i]][j]["subfields"][k]["code"] + " </span> " + " " + myData[myDataList[i]][j]["subfields"][k]["value"] + " |";
                            } else {
                                th4.innerHTML += "<span class='text-primary'>$" + myData[myDataList[i]][j]["subfields"][k]["code"] + " </span> " + " " + myData[myDataList[i]][j]["subfields"][k]["xref"] + " |";
                            }
                        }

                        if (this.myToken) {

                            // building a string with the information about the TAG Line
                            th5.innerHTML = "<span class='badge badge-pill badge-warning'><span class='dataProvider' id='" + this.recordType + "//" + th1.innerText + "//" + th2.innerText + "//" + th3.innerText + "//" + th4.innerText + "//" + (j + 1) + "'><i class='fas fa-edit'> " + (j + 1) + "/" + numOccur + "  </i></span></span>";
                            th5.addEventListener("click", () => {

                                // Hide the button save the record
                                var btn = document.getElementById("btnSaveRecord")
                                btn.style.display = "none";

                                // retrieving some parameters

                                this.idToUpdate = this.recordNumber;
                                this.typeRecordToUpdate = this.recordType;
                                // retrieving the line number
                                let recup = 0;
                                this.getDataLine("tableData", row => {
                                    // retrieving the data
                                    const yls = row.rowIndex;
                                    const myData = document.getElementsByClassName("dataProvider")[yls].id;
                                    console.log(myData)

                                    // starting the edit mode
                                    this.editMode = "True";
                                    // check if the divNewRecord is already displayed
                                    const myDiv = document.getElementById("divNewRecord");
                                    if (myDiv) {
                                        this.removeDiv(myDiv);
                                        this.tableNewRecordCreated = false;
                                        this.rowLineNewRecord = 0;
                                    }
                                    // display the framework for the new record
                                    this.createFrameNewRecord();

                                    // inserting the values in an array
                                    const recupValue = myData.split("//")

                                    // inserting values from the record selected
                                    let myTag = document.getElementById("tagCol1");
                                    let myIND1 = document.getElementById("ind1Col1");
                                    let myIND2 = document.getElementById("ind2Col1");

                                    myTag.value = recupValue[1];
                                    myIND1.value = recupValue[2];
                                    myIND2.value = recupValue[3];

                                    // Management of the subfield
                                    const recupSubFieldValues = recupValue[4].split("|")
                                        // console.log(recupSubFieldValues)
                                        // console.log(recupSubFieldValues.length)
                                    let myLine = 1;
                                    const myBox = document.getElementById("checkboxCol1");

                                    for (let i = 0; i < (recupSubFieldValues.length - 1); i++) {
                                        let myCode = "";
                                        let myValue = "";

                                        if (i === 0) {
                                            myCode = document.getElementById("code" + myLine);
                                            myCode.value = recupSubFieldValues[i].charAt(1).trim();
                                            myValue = document.getElementById("value" + myLine);
                                            myValue.value = recupSubFieldValues[i].substring(2).trim();
                                        } else {
                                            myBox.checked = true;
                                            this.addNewSubFieldLine();
                                            myCode = document.getElementById("divData1").lastChild.getElementsByTagName("SELECT")[0];
                                            myCode.value = recupSubFieldValues[i].charAt(1).trim();
                                            myValue = document.getElementById("divData1").lastChild.getElementsByTagName("INPUT")[0];
                                            myValue.value = recupSubFieldValues[i].substring(2).trim();

                                        }
                                        myLine++;
                                    }


                                    ////////////////

                                });


                            })
                        }

                        // add the tags to the parent

                        tr.appendChild(th1);
                        tr.appendChild(th2);
                        tr.appendChild(th3);
                        tr.appendChild(th4);
                        tr.appendChild(th5);
                        thead.appendChild(tr);

                    }
                }
            }
            // Adding the div to the page
            this.appendChild(divContent);

        } //else

    //}


    // Main features
    connectedCallback() {
        // Call the function
        this.createhiddenModalForm();
        this.createHeaderComponent();
        this.createScript();
        if (this.getUrlAPI()) {
            this.getDataFromApi(this.getUrlAPI());
            this.getRecordType(this.getUrlAPI());
        }
    }

    disconnectedCallback() {};

    attributeChangedCallback(attrName, oldVal, newVal) {};

}

// Define the new element
customElements.define('marc-record', MarcRecord);