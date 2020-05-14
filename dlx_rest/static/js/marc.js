
  // Class for the component
  class MarcRecord extends HTMLElement {
    
    // invoke the constructor  
    constructor() {
        
        super();

        // Definition of the id of the component
        this.heigth="1000px";
        this.width="1000px";
        this.id="marc-record";
        this.recordNumber="";
        this.recordType="";
        this.myToken=this.getToken();
        this.url=""
        this.tableNewRecordCreated=false;
        this.rowLineNewRecord=0;
        this.prefixUrl="https://czwkm00smd.execute-api.us-east-1.amazonaws.com/dev/api/";
        }; 
        
    // create the hidden Modal form
    createhiddenModalForm(){
        // creation of the modal
        this.innerHTML=  "<div id='myModal' class='modal' tabindex='-1' role='dialog'> " +
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
        " </div> " ;
    }


    // function fetching the data from the API
    async getDataFromApi(url){
        this.url=url;
        let response = await fetch(url);
        if (response.ok) { // if HTTP-status is 200-299
            // get the response body (the method explained below)
            let json = await response.json();
            let resultsList=Object.keys(json["result"]);
            let resultsSize=resultsList.length;
            let results=json["result"];
            divMailHeader.innerHTML="";
            this.displayDataFromApi(resultsList,resultsSize,results);
        } else {
            return divMailHeader.innerHTML="<div class='alert alert-danger mt-2 alert-dismissible fade show' role='alert'>Something is wrong, HTTP-Error number : " + response.status + "</div>";
        }
    }

    // call the API for deletion
    async deleteDataFromApi(userName,userPassword,recordType,recordID){

        let username = userName;
        let password = userPassword;
        let myString= this.prefixUrl + recordType + '/' + recordID;
        let encodedString=window.btoa(username+":"+password);
        let auth="Basic "+encodedString;

        fetch(myString, {
            method: 'DELETE',
            headers: new Headers({
                'Accept' : 'application/json',
                "Authorization": auth
            })
            }).then(response => {
            if (response.ok) {
            // display the mail
            divMailHeader.innerHTML="<div class='alert alert-success mt-2 alert-dismissible fade show' role='alert'>New record deleted!</div>";
            //refresh the page
            setTimeout(location.reload(),2000);
            }else{
            return divMail.innerHTML="<div class='alert alert-danger mt-2 alert-dismissible fade show' role='alert'>Something is wrong " + response.status + "</div>";
            }
            })
    }

    // call the API for creation
    async createRecord(url){
        

        let username = "dev_admin@un.org";
        let password = "password";
        
        let encodedString=window.btoa(username+":"+password);
        let auth="Basic "+encodedString;

        fetch(url,{
            method: 'post',
            headers: new Headers({
                'Accept' : 'application/json',
                "Authorization": auth
            }),
            body:JSON.stringify({'777': [{"indicators": [" ", " "], "subfields": [{"code": 'a', "value": 'yalshire test record'}]}]})
            }).then(response => {
            if (response.ok) {
            // display the mail
            divMailHeader.innerHTML="<div class='alert alert-success mt-2 alert-dismissible fade show' role='alert'>New record created!</div>";
            console.log(response.status)
            //refresh the page
            setTimeout(location.reload(),2000);
            }else{
            return divMailHeader.innerHTML="<div class='alert alert-danger mt-2 alert-dismissible fade show' role='alert'>Something is wrong " + response.status + "</div>";
            }
            })
    }

    // remove a div from the page
    removeDiv(name){
        this.removeChild(name);
    }

    // create the record form
    createFrameNewRecord(){


            this.tableNewRecordCreated=true;

            //--->create data table > start
            var tbl = '';
            tbl +='<table id="tableNewRecord" class="table table-hover" style="">'

                //--->create table header > start
                tbl +='<thead>';
                    tbl +='<tr>';
                    tbl +='<th><span class="badge badge-secondary">TAG</span></th>';
                    tbl +='<th><span class="badge badge-secondary">IND1 </span></th>';
                    tbl +='<th><span class="badge badge-secondary">IND2 </span></th>';
                    tbl +='<th><span class="badge badge-secondary">VALUE</span></th>';
                    tbl +='</tr>';
                tbl +='</thead>';
                
                
                // Create a new line in the table

                tbl +='<tbody id=tbodyNewLine>'

                this.rowLineNewRecord++;
                let row_id =this.rowLineNewRecord; 

                // creation of the header of the table

                tbl +='<tr id="'+ row_id + '">';
                tbl +='<td ><div style="display: table;" class="tagClass mt-0" col_name="tagCol" contenteditable="true"> <input id="tagCol'+ row_id +' " type="text" placeholder="Tag" maxlength="3" size="3"></div></td>';
                tbl +='<td ><div style="display: table;" class="indClass" col_name="ind1Col" contenteditable="true"><select class="mt-1" id="ind1Col'+ row_id +' "><option value="0">0</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> <option value="6">6</option> <option value="7">7</option> <option value="8">8</option><option value="9">9</option></select></div></td>';
                tbl +='<td ><div style="display: table;" class="indClass" col_name="ind2Col" contenteditable="true"><select class="mt-1" id="ind2Col'+ row_id +' "><option value="0">0</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> <option value="6">6</option> <option value="7">7</option> <option value="8">8</option><option value="9">9</option></select></div></td>';
                tbl +='<td><div style="display: table;" class="valueClass col-sm-12" col_name="valueCol" contenteditable="true"><select class="mr-2" id="code'+ row_id +' "><option value="a">a</option> <option value="b">b</option> <option value="c">c</option> <option value="d">d</option> <option value="e">e</option> <option value="f">f</option> <option value="g">g</option> <option value="h">h</option> <option value="i">i</option> <option value="j">j</option> <option value="k">k</option> <option value="l">l</option> <option value="m">m</option> <option value="n">n</option> <option value="o">o</option> <option value="p">p</option> <option value="q">q</option> <option value="r">r</option> <option value="s">s</option> <option value="t">t</option> <option value="u">u</option> <option value="v">v</option><option value="w">w</option> <option value="x">x</option> <option value="y">y</option><option value="z">z</option></select><input size="90" id="value'+ row_id +' " type="text" placeholder="Value"><span>  </span><span class="badge badge-pill badge-warning"><i class="fa fa-plus" aria-hidden="true"> ADD  </i></span><span>  </span><span class="badge badge-pill badge-warning"> <i class="fa fa-minus" aria-hidden="true"> DEL </i></span></div></td>'; 
        
                // end of the line
        
                tbl +='</tr>';

                // end of the body of the table

                tbl +='</tbody>';
            
                // end of the table

                tbl +='</table>'

                // Adding the HR line

                tbl +='<hr>'

                // Adding a div with the number of line created for the record
                tbl+="<div ><span id='valNumLineNewRecord' >" + this.rowLineNewRecord + "</span> line(s) created for this record </div>"

                // Adding the Button

                tbl +="<button type='button' class='btn btn-success mb-2'>Save the record</button>";
                
                // check if the div content is already created 

                let divContent=document.getElementById("divContent");
                if (divContent!==null){
                   //this.removeDiv(divContent);
                   divContent.innerHTML=" ";
                }

               // check if the div detail is already created 
               let divDetail=document.getElementById("divDetail");
               if (divDetail!==null){
                  //this.removeDiv(divDetail);
                  divDetail.innerHTML=" ";
               }

                // check if the div newRecord is already created 
                let divNewRecord=document.getElementById("divNewRecord");         
                if (divNewRecord!==null){
                    divNewRecord.innerHTML=" ";
                    //this.removeDiv(divNewRecord);
                }

                // create the div for the data
                if (divNewRecord===null){
                    divNewRecord = document.createElement("DIV");
                    divNewRecord.id="divNewRecord";
                }

                //divNewRecord.appendChild(table);

                divNewRecord.innerHTML=tbl;
                this.appendChild(divNewRecord);
    }
    setModalWindos(myClass,myTitle,MyContent,myBtnLbl){
        document.getElementById("modalTitle").innerHTML=`<div class='"+${myClass}+"' role='alert'> "+${myTitle}+"</div>`;
        document.getElementById("modalContent").innerHTML=`<div class='form-group'><label for='modalUrl'>"+${myBtnLbl}+"</label><input type='text' class='form-control' id='modalUrl'></div>`;
        let myButtonHeader=document.getElementById("modalButton");
        myButtonHeader.innerHTML=`${myBtnLbl}`;
        };
    
    addNewLineRecord(row_id){

        if (this.tableNewRecordCreated==true) {
            const myTable =  document.getElementById("tableNewRecord"); 
            let NewRow = myTable.insertRow(-1); 
            let cell1 = NewRow.insertCell(0); 
            let cell2 = NewRow.insertCell(1); 
            let cell3 = NewRow.insertCell(2); 
            let cell4 = NewRow.insertCell(3); 
            cell1.innerHTML = '<div style="display: table;" class="tagClass mt-0" col_name="tagCol" contenteditable="true"> <input id="tagCol'+ row_id +' " type="text" placeholder="Tag" maxlength="3" size="3"></div>'; 
            cell2.innerHTML = '<div style="display: table;" class="indClass" col_name="ind1Col" contenteditable="true"><select class="mt-1" id="ind1Col'+ row_id +' "><option value="0">0</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> <option value="6">6</option> <option value="7">7</option> <option value="8">8</option><option value="9">9</option></select></div>'; 
            cell3.innerHTML = '<div style="display: table;" class="indClass" col_name="ind2Col" contenteditable="true"><select class="mt-1" id="ind2Col'+ row_id +' "><option value="0">0</option> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> <option value="6">6</option> <option value="7">7</option> <option value="8">8</option><option value="9">9</option></select></div>'; 
            cell4.innerHTML = '<div style="display: table;" class="valueClass col-sm-12" col_name="valueCol" contenteditable="true"><select class="mr-2" id="code'+ row_id +' "><option value="a">a</option> <option value="b">b</option> <option value="c">c</option> <option value="d">d</option> <option value="e">e</option> <option value="f">f</option> <option value="g">g</option> <option value="h">h</option> <option value="i">i</option> <option value="j">j</option> <option value="k">k</option> <option value="l">l</option> <option value="m">m</option> <option value="n">n</option> <option value="o">o</option> <option value="p">p</option> <option value="q">q</option> <option value="r">r</option> <option value="s">s</option> <option value="t">t</option> <option value="u">u</option> <option value="v">v</option><option value="w">w</option> <option value="x">x</option> <option value="y">y</option><option value="z">z</option></select><input size="90" id="value'+ row_id +' " type="text" placeholder="Value"><span>  </span><span class="badge badge-pill badge-warning"><i class="fa fa-plus" aria-hidden="true"> ADD  </i></span><span>  </span><span class="badge badge-pill badge-warning"> <i class="fa fa-minus" aria-hidden="true"> DEL </i></span></div>'; 
            this.rowLineNewRecord++;
            this.updateNumberOfLineRecord();
        }
         else
        {
             alert("Please create a new the record first!!!");
        }


    }

    removeLastLineRecord(){
        if (this.tableNewRecordCreated==true && (this.rowLineNewRecord>1)) {
            const myTable=document.getElementById("tableNewRecord")
            myTable.deleteRow(-1);
            this.rowLineNewRecord=this.rowLineNewRecord-1;
            console.log(this.rowLineNewRecord)
            this.updateNumberOfLineRecord();
        }
        else
        {
            alert("Please create a new the record first!!!");
        }
    }

    // update the number of lines variable

    updateNumberOfLineRecord(){
        // check if the div detail is already created 
        let myNumber=document.getElementById("valNumLineNewRecord");
        if (myNumber!==null){
        // assign the new value of the variable
        myNumber.innerHTML=this.rowLineNewRecord;
        }
    }

    generateDataToSave(){

    }

    // get the ID of the record
    getRecordType(url){
        if (url){
        let letter=(url.substring(63, 64));
        return (letter=== "a") ? "auths" : "bibs";
        } else {
            return "N/A"
        }
    }

    // get the ID of the record
    getRecordID(){
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
        this.setAttribute('name','not defined');
        }
     }
    
    createHeaderComponent(){
        
        /////////////////////////////////////////////////////////////////////////////////
        // creation of the header of the component
        /////////////////////////////////////////////////////////////////////////////////

        let that=this;

        // create the div for the _id
        let divHeader = document.createElement("DIV");
        divHeader.innerHTML="<h3> MARC EDITOR version 1.0 </h3> ";

        // Adding the name of the div
        divHeader.setAttribute("id","divHeader");

        // Adding the style
        divHeader.className="mt-3 mb-3 text-left text-success";

        // Adding the div to the page
        this.appendChild(divHeader);

        // create the div for the data
        let divContentHeader = document.createElement("DIV");
        divContentHeader.id="divContentHeader";
        this.appendChild(divContentHeader);

        // create the div for the mail
        let divMailHeader= document.createElement("DIV");
        divMailHeader.id="divMailHeader";
        this.appendChild(divMailHeader);

        let isToken = this.getToken();

        if (isToken!==""){
                
                // Display the button for the displaying a new record
                let btnDisplayNewRecordHeader = document.createElement("BUTTON");
                btnDisplayNewRecordHeader.className="btn btn-secondary mr-2 mb-2";
                btnDisplayNewRecordHeader.id="btnDisplayNewRecord";
                btnDisplayNewRecordHeader.innerHTML="Display a new record";
                divContentHeader.appendChild(btnDisplayNewRecordHeader);     
        
                btnDisplayNewRecordHeader.setAttribute('data-toggle','modal');
                btnDisplayNewRecordHeader.setAttribute('data-target','#myModal');

                // adding the logic to call the new url
                btnDisplayNewRecordHeader.addEventListener("click",()=>{
                document.getElementById("modalTitle").innerHTML="<div class='alert alert-success mt-2' role='alert'>Display one record</div>";
                document.getElementById("modalContent").innerHTML="<div class='form-group'><label for='modalUrl'>Please insert the url of the record</label><input type='text' class='form-control' id='modalUrl'></div>";
                let myButtonHeader=document.getElementById("modalButton");
                myButtonHeader.innerHTML="Display";
                });

                document.getElementById("modalButton").addEventListener("click",()=>{
                let myVal=document.getElementById("modalUrl");
                if (myVal) {
                    this.getDataFromApi(myVal.value);
                }
                document.getElementById("modalClose").click();
                })

                // create the button for a new record
   
                 let btnCreateNewRecord = document.createElement("BUTTON");
                 btnCreateNewRecord.className="btn btn-primary mr-2 mb-2";
                 btnCreateNewRecord.id="btnDisplayNewRecord";
                 btnCreateNewRecord.innerHTML="Create a new record";
                 divContentHeader.appendChild(btnCreateNewRecord);  
 
                 // adding the logic to call the new url
                 btnCreateNewRecord.addEventListener("click",()=>{

                    const myDiv=document.getElementById("divNewRecord");
                    if (myDiv){
                        this.removeDiv(myDiv);
                        this.tableNewRecordCreated=false;
                        this.rowLineNewRecord=0;
                    }
                        this.createFrameNewRecord();
                 });

                // create the button for adding a new line for the record

                let btnAddingNewLine = document.createElement("BUTTON");
                btnAddingNewLine.className="btn btn-info mr-2 mb-2";
                btnAddingNewLine.id="btnAddingNewLine";
                btnAddingNewLine.innerHTML="Add a new line for the record";
                divContentHeader.appendChild(btnAddingNewLine);  

                // adding the logic to call the new url
                btnAddingNewLine.addEventListener("click",()=>{
                    this.addNewLineRecord(this.rowLineNewRecord);
                });

                // create the button for deleting a new line for the record

                let btnDeletingNewLine = document.createElement("BUTTON");
                btnDeletingNewLine.className="btn btn-info mr-2 mb-2";
                btnDeletingNewLine.id="btnDeletingNewLine";
                btnDeletingNewLine.innerHTML="Delete the last line of the record";
                divContentHeader.appendChild(btnDeletingNewLine);  

                // adding the logic to call the new url
                btnDeletingNewLine.addEventListener("click",()=>{
                    this.removeLastLineRecord();
                });

                // Adding the dropdown list to define the type of record
                let myHtml = document.createElement("DIV");
                    myHtml.innerHTML=`<select class="custom-select" id="selectTypeRecord" style="width: 300px;">
                                    <option selected>Please select the record type</option>
                                    <option value="Bibs">Bibliographic record</option>
                                    <option value="Auths">Authority Record</option>
                            </select>`
                    myHtml.id="divRecordType"
                    myHtml.className="mr-2 mb-2";          
                divContentHeader.appendChild(myHtml);
            }
            
            else {
                divHeader.innerHTML="<h3> MARC EDITOR version 1.0 (Unknown User) </h3> ";
            }
    }

    // function generating the record with the value from the API
    displayDataFromApi(myDataList,myDataSize,myData){

        // check if the record is already displayed
        let divNewRecord=document.getElementById("divNewRecord");
        if (divNewRecord!==null){
            divNewRecord.innerHTML=" ";
        }
        let divRecordType=document.getElementById("divRecordType");
        if (divRecordType!==null){
           divRecordType.innerHTML=" ";
        }

        // check if the record is already displayed
        //if (this.recordNumber!==myData["_id"]){
        //if (true){

            console.log("entered")

                // loop to display the values
                let md=myDataList.sort();

                /////////////////////////////////////////////////////////////////////////////////
                // creation of the header of the component
                /////////////////////////////////////////////////////////////////////////////////
                
                // create the div for the _id
                // check if the div is already created if no we can create it
                let divDetail=document.getElementById("divDetail");
                if (divDetail===null){
                    divDetail = document.createElement("DIV");
                    // Adding the div to the page
                    this.appendChild(divDetail);
                }

                this.recordType=this.getRecordType(this.url);
                // be sure to empty the div
                let recupId=this.getRecordID();

                divDetail.innerHTML = "<h3 class='text-dark'>Record ID : " + myData["_id"] +"  </h3>  <span class='text-dark'>Record Type:  " +  this.recordType + "</span>";
                
                // Adding the ID
                divDetail.id="divDetail";

                this.recordNumber=myData["_id"];
                this.getRecordID();

                // Adding the style
                divDetail.className="mt-3 mb-3 text-left text-success";

                // // check if the div is already created if no we can create it
                // let divNewRecord=document.getElementById("divNewRecord");
                // if (divNewRecord!==null){
                //     this.removeChild(divNewRecord);
                //     console.log("removed")
                // }

                // check if the div is already created if no we can create it
                let divContent=document.getElementById("divContent");
                    
                if (divContent!==null){
                divContent.innerHTML=" ";
                }
            
                // create the div for the data
                if (divContent===null){
                divContent = document.createElement("DIV");
                this.appendChild(divContent);
                divContent.id="divContent";

                // create the div for the mail
                let divMail= document.createElement("DIV");
                divMail.id="divMail";
                this.appendChild(divMail);
                }

                // create the hr 
                let hr1 = document.createElement("HR");
                divContent.appendChild(hr1);           
        
                // create the button for the deletion
                let btnDeleteRecord = document.createElement("BUTTON");
                btnDeleteRecord.className="btn btn-danger mr-2";
                btnDeleteRecord.id="btnDeleteRecord";
                btnDeleteRecord.innerHTML="Delete this record";
                if (this.myToken) {
                divContent.appendChild(btnDeleteRecord);   
                }
                btnDeleteRecord.setAttribute('data-toggle','modal');    
                btnDeleteRecord.setAttribute('data-target','#myModal');
        
                // adding the logic to delete a record
                btnDeleteRecord.addEventListener("click",()=>{
                    document.getElementById("modalTitle").innerHTML="<div class='alert alert-danger mt-2' role='alert'>Delete the record</div>";
                    document.getElementById("modalContent").innerHTML="Be careful, you are about to delete the record with the ID :   <strong>" + this.getRecordID()+"</strong>";
                    let myButton=document.getElementById("modalButton");
                    myButton.innerHTML="Delete";
                    myButton.addEventListener("click",()=>{
                        this.deleteDataFromApi("dev_admin@un.org","password",this.recordType,this.recordNumber);
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
                thead.className="thead-light";
                table.className="table-sm";
        
                // add the values of the columns
                th1.innerHTML="<span class='badge badge-secondary'> TAG </span>";
                th2.innerHTML="<span class='badge badge-secondary'> IND1 </span>";
                th3.innerHTML="<span class='badge badge-secondary'> IND2 </span>";
                th4.innerHTML="<span class='badge badge-secondary'> VALUE </span>";
                if (this.myToken) {
                    th5.innerHTML="<span class='badge badge-secondary'> EDIT </span>";
                }
        
                divContent.appendChild(table);
                this.appendChild(divContent);
                this.appendChild(divDetail);
        
                
                /////////////////////////////////////////////////////////////////////////////////
                // Loop the records and build the table
                /////////////////////////////////////////////////////////////////////////////////
        
                for (let i = 0; i < myDataSize; i++) {
                    
                        // Display the metadata part
                        if ((myDataList[i]!=="_id") && (myDataList[i]<"029")) {
        
                            let tr = document.createElement("TR");
                            let th1 = document.createElement("TH");
                            let th2 = document.createElement("TH");
                            let th3 = document.createElement("TH");
                            let th4 = document.createElement("TH");
                            let th5 = document.createElement("TH");
        
                            th1.innerHTML="<span class='badge badge-pill badge-secondary'>" + myDataList[i] + "</span>" ; 
                            th2.innerHTML="N/A";
                            th3.innerHTML="N/A";
                            th4.innerHTML=myData[myDataList[i]]; 
                            if (this.myToken) {
                                th5.innerHTML="<span class='badge badge-pill badge-warning'><i class='fas fa-edit'>  </i></span>";
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
                            if (parseInt(myDataList[i],10)>=29) {
        
                                for (let j = 0; j < myData[myDataList[i]].length; j++) {
        
                                    let tr = document.createElement("TR");
                                    let th1 = document.createElement("TH");
                                    let th2 = document.createElement("TH");
                                    let th3 = document.createElement("TH");
                                    let th4 = document.createElement("TH");
                                    let th5 = document.createElement("TH");
        
        
                                    let val1 =(myData[myDataList[i]][j]["indicators"][0] !==" ") ? myData[myDataList[i]][j]["indicators"][0] : " _ ";
                                    let val2 =(myData[myDataList[i]][j]["indicators"][1] !==" ") ? myData[myDataList[i]][j]["indicators"][1] : " _ ";
                                    th1.innerHTML="<span class='badge badge-pill badge-secondary'>" + myDataList[i] + "</span>"; 
                                    th2.innerHTML=val1; 
                                    th3.innerHTML=val2; 
        
                            
                                    // retrieve the number of subfields
                                    let numberSubfield=myData[myDataList[i]][j]["subfields"].length;
        
                                    for (let k = 0; k < numberSubfield; k++) {
                                        // loop for the subfields
                                        th4.innerHTML+="<span class='text-primary'>$"+myData[myDataList[i]][j]["subfields"][k]["code"] + " </span> "+ " " + myData[myDataList[i]][j]["subfields"][k]["value"] +" |";      
                                    }
                                    if (this.myToken) {
                                    th5.innerHTML="<span class='badge badge-pill badge-warning'><span><i class='fas fa-edit'>  </i></span></span>";
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
    //this.createRecord(this.prefixUrl+"bibs")
    this.createhiddenModalForm();
    this.createHeaderComponent();
    if (this.getUrlAPI()){
        this.getDataFromApi(this.getUrlAPI());
        this.getRecordType(this.getUrlAPI());
        }
    }

    disconnectedCallback() {};

    attributeChangedCallback(attrName, oldVal, newVal) {};

    }

// Define the new element
customElements.define('marc-record', MarcRecord);

