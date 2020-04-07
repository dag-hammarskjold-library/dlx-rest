  // Class for the component
  class MarcRecord extends HTMLElement {
    
    // invoke the constructor  
    constructor() {
        
        super();

        // Definition of the id of the component
        this.id="marc-record";
        this.recordNumber="";
        this.recordType="";
        this.myToken=this.getToken();
        };

    // function fetching the data from the API
    async getDataFromApi(url){
        let response = await fetch(url);
        if (response.ok) { // if HTTP-status is 200-299
            // get the response body (the method explained below)
            let json = await response.json();

            //console.log(json["result"]);
            //console.log(json["result"]["191"][0]["subfields"][0]);
            //console.log(json["result"]["089"].length);
            let resultsList=Object.keys(json["result"]);
            let resultsSize=resultsList.length;
            let results=json["result"];
            this.displayDataFromApi(resultsList,resultsSize,results);
          } else {
            alert("HTTP-Error: " + response.status);
          }
    }

    // get the ID of the record
    getRecordType(url){
        let letter=(url.substring(63, 64));
        return (letter=== "a") ? "AUTHS" : "BIBS";
    }

    // get the ID of the record
    getRecordID(){
        console.log(this.recordNumber);
    }
    
    // get the url of the record first load
    getUrlAPI() {
        return this.getAttribute('name');
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
   
    // function generating the record with the value from the API
    displayDataFromApi(myDataList,myDataSize,myData){

        /////////////////////////////////////////////////////////////////////////////////
        // creation of the header of the component
        /////////////////////////////////////////////////////////////////////////////////

        // loop to display the values
        let md=myDataList.sort();
        
        // create the div for the _id
        let div = document.createElement("DIV");
        div.innerHTML="<h3>Record id : " + myData["_id"] + "</h3>";

        // Adding the name of the div
        div.setAttribute("Name","divId");
        
        // Adding the ID
        div.id=myData["_id"];

        this.recordNumber=myData["_id"];
        this.getRecordID();

        // Adding the style
        div.className="mt-3 mb-3 text-left text-success";

        // Adding the div to the page
        this.appendChild(div);

        // create the div for the data
        let divContent = document.createElement("DIV");
        divContent.id="divContent";
        this.appendChild(divContent);

        // create the hr 
        let hr1 = document.createElement("HR");
        divContent.appendChild(hr1);

        // create the div for the mail
        let divMail= document.createElement("DIV");
        divMail.id="divMail";
        this.appendChild(divMail);

        // create the button for a new TAG
        let btnCreateNewRecord = document.createElement("BUTTON");
        btnCreateNewRecord.className="btn btn-primary mr-2";
        btnCreateNewRecord.id="btnCreateNewRecord";
        btnCreateNewRecord.innerHTML="Create a new TAG";
        if (this.myToken) {
        divContent.appendChild(btnCreateNewRecord);
        }

        // create the button for the deletion
        let btnDeleteRecord = document.createElement("BUTTON");
        btnDeleteRecord.className="btn btn-danger mr-2";
        btnDeleteRecord.id="btnDeleteRecord";
        btnDeleteRecord.innerHTML="Delete this record";
        if (this.myToken) {
        divContent.appendChild(btnDeleteRecord);   
        }
        
        // create the button for the displaying a new record
        let btnDisplayNewRecord = document.createElement("BUTTON");
        btnDisplayNewRecord.className="btn btn-secondary mr-2";
        btnDisplayNewRecord.id="btnDisplayNewRecord";
        btnDisplayNewRecord.innerHTML="Display a new record";
        divContent.appendChild(btnDisplayNewRecord);     

        // adding the logic to call the new url
        btnDisplayNewRecord.addEventListener("click",()=>{
            let recup=prompt("Please insert the url of the new record to display!!!");
            this.innerHTML="";
            this.getDataFromApi(recup);
            divMail.innerHTML="<div class='alert alert-success mt-2' role='alert'>New record displayed!</div>";
            this.appendChild(divMail);
          });
        
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
        this.appendChild(div);

        
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
    // Class for the component
  class MarcRecord extends HTMLElement {
    
    // invoke the constructor  
    constructor() {
        
        super();

        // Definition of the id of the component
        this.id="marc-record";
        this.recordNumber="";
        this.recordType="";
        this.myToken=this.getToken();
        };

    // function fetching the data from the API
    async getDataFromApi(url){
        let response = await fetch(url);
        if (response.ok) { // if HTTP-status is 200-299
            // get the response body (the method explained below)
            let json = await response.json();

            //console.log(json["result"]);
            //console.log(json["result"]["191"][0]["subfields"][0]);
            //console.log(json["result"]["089"].length);
            let resultsList=Object.keys(json["result"]);
            let resultsSize=resultsList.length;
            let results=json["result"];
            this.displayDataFromApi(resultsList,resultsSize,results);
          } else {
            alert("HTTP-Error: " + response.status);
          }
    }

    // get the ID of the record
    getRecordType(url){
        let letter=(url.substring(63, 64));
        return (letter=== "a") ? "AUTHS" : "BIBS";
    }

    // get the ID of the record
    getRecordID(){
        console.log(this.recordNumber);
    }
    
    // get the url of the record first load
    getUrlAPI() {
        return this.getAttribute('name');
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
   
    // function generating the record with the value from the API
    displayDataFromApi(myDataList,myDataSize,myData){

        /////////////////////////////////////////////////////////////////////////////////
        // creation of the header of the component
        /////////////////////////////////////////////////////////////////////////////////

        // loop to display the values
        let md=myDataList.sort();
        
        // create the div for the _id
        let div = document.createElement("DIV");
        div.innerHTML="<h3>Record id : " + myData["_id"] + "</h3>";

        // Adding the name of the div
        div.setAttribute("Name","divId");
        
        // Adding the ID
        div.id=myData["_id"];

        this.recordNumber=myData["_id"];
        this.getRecordID();

        // Adding the style
        div.className="mt-3 mb-3 text-left text-success";

        // Adding the div to the page
        this.appendChild(div);

        // create the div for the data
        let divContent = document.createElement("DIV");
        divContent.id="divContent";
        this.appendChild(divContent);

        // create the hr 
        let hr1 = document.createElement("HR");
        divContent.appendChild(hr1);

        // create the div for the mail
        let divMail= document.createElement("DIV");
        divMail.id="divMail";
        this.appendChild(divMail);

        // create the button for a new TAG
        let btnCreateNewRecord = document.createElement("BUTTON");
        btnCreateNewRecord.className="btn btn-primary mr-2";
        btnCreateNewRecord.id="btnCreateNewRecord";
        btnCreateNewRecord.innerHTML="Create a new TAG";
        if (this.myToken) {
        divContent.appendChild(btnCreateNewRecord);
        }

        // create the button for the deletion
        let btnDeleteRecord = document.createElement("BUTTON");
        btnDeleteRecord.className="btn btn-danger mr-2";
        btnDeleteRecord.id="btnDeleteRecord";
        btnDeleteRecord.innerHTML="Delete this record";
        if (this.myToken) {
        divContent.appendChild(btnDeleteRecord);   
        }
        
        // create the button for the displaying a new record
        let btnDisplayNewRecord = document.createElement("BUTTON");
        btnDisplayNewRecord.className="btn btn-secondary mr-2";
        btnDisplayNewRecord.id="btnDisplayNewRecord";
        btnDisplayNewRecord.innerHTML="Display a new record";
        divContent.appendChild(btnDisplayNewRecord);     

        // adding the logic to call the new url
        btnDisplayNewRecord.addEventListener("click",()=>{
            let recup=prompt("Please insert the url of the new record to display!!!");
            this.innerHTML="";
            this.getDataFromApi(recup);
            divMail.innerHTML="<div class='alert alert-success mt-2' role='alert'>New record displayed!</div>";
            this.appendChild(divMail);
          });
        
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
        this.appendChild(div);

        
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
    }

    // Main features
    connectedCallback() {
    // Call the function
    this.getDataFromApi(this.getUrlAPI());
    this.getRecordType(this.getUrlAPI());
    }

    disconnectedCallback() {};

    attributeChangedCallback(attrName, oldVal, newVal) {};

    }



// Define the new element
customElements.define('marc-record', MarcRecord);      this.appendChild(divContent);
    }

    // Main features
    connectedCallback() {
    // Call the function
    this.getDataFromApi(this.getUrlAPI());
    this.getRecordType(this.getUrlAPI());
    }

    disconnectedCallback() {};

    attributeChangedCallback(attrName, oldVal, newVal) {};

    }



// Define the new element
customElements.define('marc-record', MarcRecord);
