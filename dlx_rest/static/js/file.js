import FileContent from "./filecontent.js";

let input = document.getElementById("files");
let preview = document.querySelector(".preview");
let txt = document.getElementById("fileText"); 
let fileObjectArray = [];

input.style.opacity = 0;
txt.style.opacity = 0;


/**Updated Section*/
/**
 * Add event listeners to the language pills.
 */
 const toggleEN = function () {
   
  // Find the current file object in fileObjectArray
  let fileObject = fileObjectArray.find(
     ({ id }) => id === parseInt(this.parentElement.parentElement.parentElement.id)
  );

  //remove existing class name 
  this.classList.remove(fileObject.en.className);

  //update the language values to the opposite of what it was
  fileObject.updateLangEN();

  //re-add the class name
  this.classList.add(fileObject.en.className);

  txt.value = JSON.stringify(fileObjectArray);
  
};
const toggleFR = function () {
  
  // Find the current file object in fileObjectArray
  let fileObject = fileObjectArray.find(
     ({ id }) => id === parseInt(this.parentElement.parentElement.parentElement.id)
  );

  //remove existing class name 
  this.classList.remove(fileObject.fr.className);

  //update the language values to the opposite of what it was
  fileObject.updateLangFR();

  //re-add the class name
  this.classList.add(fileObject.fr.className);

  txt.value = JSON.stringify(fileObjectArray);

};
const toggleES = function () {
  
  // Find the current file object in fileObjectArray
  let fileObject = fileObjectArray.find(
     ({ id }) => id === parseInt(this.parentElement.parentElement.parentElement.id)
  );

  //remove existing class name 
  this.classList.remove(fileObject.es.className);

  //update the language values to the opposite of what it was
  fileObject.updateLangES();

  //re-add the class name
  this.classList.add(fileObject.es.className);

  txt.value = JSON.stringify(fileObjectArray);

};
const toggleAR = function () {
  
  // Find the current file object in fileObjectArray
  let fileObject = fileObjectArray.find(
     ({ id }) => id === parseInt(this.parentElement.parentElement.parentElement.id)
  );

  //remove existing class name 
  this.classList.remove(fileObject.ar.className);

  //update the language values to the opposite of what it was
  fileObject.updateLangAR();

  //re-add the class name
  this.classList.add(fileObject.ar.className);

  txt.value = JSON.stringify(fileObjectArray);
};
const toggleZH = function () {
  
  // Find the current file object in fileObjectArray
  let fileObject = fileObjectArray.find(
     ({ id }) => id === parseInt(this.parentElement.parentElement.parentElement.id)
  );

  //remove existing class name 
  this.classList.remove(fileObject.zh.className);

  //update the language values to the opposite of what it was
  fileObject.updateLangZH();

  //re-add the class name
  this.classList.add(fileObject.zh.className);

  txt.value = JSON.stringify(fileObjectArray);

};
const toggleRU = function () {
  
  // Find the current file object in fileObjectArray
  let fileObject = fileObjectArray.find(
     ({ id }) => id === parseInt(this.parentElement.parentElement.parentElement.id)
  );

  //remove existing class name 
  this.classList.remove(fileObject.ru.className);

  //update the language values to the opposite of what it was
  fileObject.updateLangRU();

  //re-add the class name
  this.classList.add(fileObject.ru.className);

  txt.value = JSON.stringify(fileObjectArray);

};
const toggleDE = function () {
  
  // Find the current file object in fileObjectArray
  let fileObject = fileObjectArray.find(
     ({ id }) => id === parseInt(this.parentElement.parentElement.parentElement.id)
  );

  //remove existing class name 
  this.classList.remove(fileObject.de.className);

  //update the language values to the opposite of what it was
  fileObject.updateLangDE();

  //re-add the class name
  this.classList.add(fileObject.de.className);

  txt.value = JSON.stringify(fileObjectArray);

};

/**
 * Add event listener to document symbol column.
 */
 const changeDS = function () {
  
  // Find the current file object in fileObjectArray
  let fileObject = fileObjectArray.find(
     ({ id }) => id === parseInt(this.parentElement.id)
  );

  //update the document symbol to the current text
  fileObject.updateSymbol(this.innerText);

  txt.value = JSON.stringify(fileObjectArray);
};

/**
 * Add event listener to overwrite/keep radio button.
 */


const toggleAction = function (e) {
  
  // Find the current file object in fileObjectArray
  let fileObject = fileObjectArray.find(
     ({ id }) => id === parseInt(this.parentElement.parentElement.parentElement.parentElement.parentElement.id)
  
  );
 
  //update the status
  fileObject.updateOverwrite(e.target.value);

  txt.value = JSON.stringify(fileObjectArray);
};
/** END updated section */

input.addEventListener("change", createFileObjects);

/* For each file added to the drag/drop or browse, create a file object*/
function createFileObjects() {
  
  while (preview.firstChild) {
    preview.removeChild(preview.firstChild);
  }

  //get the list of files added
  const curFiles = input.files;

  //if there are none, show that no files were selected
  if (curFiles.length === 0) {
    const para = document.createElement("p");
    para.textContent = "No files currently selected for upload";
    preview.appendChild(para);
  }
  //otherwise, create objects and display table
  else {

    let table = document.createElement("table");
    table.classList.add("table", "table-sm", "table-hover");
    table.setAttribute("id","table_upload")
    preview.appendChild(table);
    
    const thead = document.createElement("thead");

    table.appendChild(thead);

    const tr = document.createElement("tr");

    thead.appendChild(tr);

    let th_txt = ["File Name", "Document Symbol", "Language(s)", "Keep All / Overwrite All " , " "];

    for (let t in th_txt) {
      const th = document.createElement("th");
      th.textContent = th_txt[t];

      // Add the checkbox Overwrite All
      if (th_txt[t]==="Keep All / Overwrite All "){
        let ovrwriteAll = document.createElement("INPUT");
        ovrwriteAll.setAttribute("type", "checkbox");
        th.appendChild(ovrwriteAll)

      // creation of the listener
      ovrwriteAll.addEventListener("click",()=>{
          let listOverwrite=document.getElementsByClassName("overwrite-class")
          let listkeep=document.getElementsByClassName("keep-class")
          for (let i = 0; i < listOverwrite.length; i++) {

              // update the UI
              (ovrwriteAll.checked==true) ? listOverwrite[i].checked=true : listkeep[i].checked=true;
          }
           // update the file object
          fileObjectArray.forEach(element=>{
            (ovrwriteAll.checked==true) ? element.updateOverwrite("overwrite") : element.updateOverwrite("keep") ;
            txt.value = JSON.stringify(fileObjectArray);
          })
        })
      }      
      tr.appendChild(th);
    }

    const tbody = document.createElement("tbody");
    table.appendChild(tbody);


    let i = 0;
    for (const file of curFiles) {
      fileObjectArray.push(new FileContent(i, file.name, setLanguage(file.name)));
      i = i + 1;
    }

    fileObjectArray.forEach((file) => {
    // const fileList = fileOjectArray.map((file) => {
      let fileEntry = document.createElement("tr");
      fileEntry.setAttribute("id", file.id);
    
      fileEntry.innerHTML = `
        <td class="file__filename">${file.filename}</td>
        <td class="file__docSymbol" contenteditable="true">${file.docSymbol}</td>
        <td>
           <div>
              <span class="badge rounded-pill ${file.en.className} file__EN">EN</span>
              <span class="badge rounded-pill ${file.fr.className} file__FR">FR</span>
              <span class="badge rounded-pill ${file.es.className} file__ES">ES</span>
              <span class="badge rounded-pill ${file.ar.className} file__AR">AR</span>
              <span class="badge rounded-pill ${file.zh.className} file__ZH">ZH</span>
              <span class="badge rounded-pill ${file.ru.className} file__RU">RU</span>
              <span class="badge rounded-pill ${file.de.className} file__DE">DE</span>
         </div>
        </td>
        <td>
            <div class="row">
              <div class="col">
                <div class="col form-check col-form-label-sm">
                  <input class="form-check-input file__action keep-class" type="radio" name="status${file.id}" 
                        value="keep" ${file.overwrite ? "" : "checked"}>
                  <label class="form-check-label" for="keep">Keep</label>
                  </div>
                </div>
             
               <div class="col">
                  <div class="form-check col-form-label-sm">
                  <input class="form-check-input file__action overwrite-class" type="radio" name="status${file.id}" 
                     value="overwrite" ${file.overwrite ? "checked" : ""}>
                  <label class="form-check-label" for="overwrite">Overwrite</label>
               </div>
            </div>
          </div>
        </td>
       <!-- <td id="${file.filename}" title="remove this file"><i class="fa fa-trash mt-2" aria-hidden="true" style="color: #11a745;" onclick="deleteRow()"></i></td> -->
      `;


      
      // Add event listeners for docsymbol
      const ds = fileEntry.querySelector(".file__docSymbol");

      const checkSpaceInName= function(){
            // adding background color when we have spaces in docsymbol
            (ds.textContent.indexOf(" ")>=0) ? ds.style.backgroundColor = "#FFEBCD" : ds.style.backgroundColor = "#FFFFFF";
          }

      ds.addEventListener("blur", changeDS);
      ds.addEventListener("DOMSubtreeModified", checkSpaceInName);

      checkSpaceInName()  

      const en = fileEntry.querySelector(".file__EN");
      en.addEventListener("click", toggleEN);
   
      const fr = fileEntry.querySelector(".file__FR");
      fr.addEventListener("click", toggleFR);
   
      const es = fileEntry.querySelector(".file__ES");
      es.addEventListener("click", toggleES);
   
      const ar = fileEntry.querySelector(".file__AR");
      ar.addEventListener("click", toggleAR);
   
      const zh = fileEntry.querySelector(".file__ZH");
      zh.addEventListener("click", toggleZH);
   
      const ru = fileEntry.querySelector(".file__RU");
      ru.addEventListener("click", toggleRU);
   
      const de = fileEntry.querySelector(".file__DE");
      de.addEventListener("click", toggleDE);
   
      const action = fileEntry.querySelectorAll(".file__action");
      
      for (const a of action) {
         a.addEventListener("click", toggleAction);
      }
      tbody.append(fileEntry);
    });

    /** COME BACK TO THIS PART */
    txt.value = JSON.stringify(fileObjectArray);
    
  }
}

function setLanguage(filename) {
  //remove file extension
  let a = filename.replace(/\.[^.$]+$/g, "");

  //get language suffix
  let b = a.match(/(-[ACEFRSGZD][A-Z]?)+$/g); //
  
  let lang = [];
  let c = [];//"";

  if (b === null)
    //default to english
    lang.push("EN");
  //parse the text
  else c = b[0].split("-"); 
  //b[0].replaceAll(/-/g, ""); //remove dashes

  for (let i = 0; i < c.length; i++) {
  
    switch (c[i]) {
      case "A":
        lang.push("AR");
        break;
      case "AR":
        lang.push("AR");
        break;
      case "C":
        lang.push("ZH");
        break;
      case "ZH":
        lang.push("ZH");
        break;
      case "E":
        lang.push("EN");
        break;
      case "EN":
        lang.push("EN");
        break;
      case "F":
        lang.push("FR");
        break;
      case "FR":
        lang.push("FR");
        break;
      case "G":
        lang.push("DE");
        break;
      case "DE":
        lang.push("DE");
        break;
      case "R":
        lang.push("RU");
        break;
      case "RU":
        lang.push("RU");
        break;
      case "S":
        lang.push("ES");
        break;
      case "ES":
        lang.push("ES");
        break;
      default:
        break;
    }
  }

  return lang;
}
