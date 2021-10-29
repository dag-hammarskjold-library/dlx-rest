import FileContent from "./filecontent.js";

const input = document.getElementById("files");
const preview = document.querySelector(".preview");
const txt = document.getElementById("fileText"); //new
const fileObjectArray = [];

input.style.opacity = 0;
txt.style.opacity = 0;

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
    const table = document.createElement("table");
    table.classList.add("table");
    table.classList.add("table-striped");

    preview.appendChild(table);

    const thead = document.createElement("thead");

    table.appendChild(thead);

    const tr = document.createElement("tr");

    thead.appendChild(tr);

    let th_txt = ["File Name", "Document Symbol", "Language(s)"];

    for (let t in th_txt) {
      const th = document.createElement("th");
      th.textContent = th_txt[t];
      tr.appendChild(th);
    }

    let i = 0;
    for (const file of curFiles) {
      fileObjectArray.push(new FileContent(i, file.name, setDocSymbol(file.name), setLanguage(file.name)));
      i = i + 1;
    }
    //fileObjectArray.forEach(element => console.log(element));
    fileObjectArray.forEach((element) => {
      const row = document.createElement("tr");
      //   row.innerHTML = `
      //   <td>${element.name}</td>
      //   <td>${element.docSymbol}</td>
      //   <td>${element.language}</td>
      // `;

      //column #1 - name of each file
      const col_1 = document.createElement("td");
      col_1.textContent = element.name;



      //column #2 - document symbol
      const col_2 = document.createElement("td");
      col_2.textContent = element.docSymbol;

      col_2.addEventListener("click", (e) => {
        console.log(`Event fired in col2: ${e}`);
      });


      //column #3 - language
      const col_3 = document.createElement("td");

      for (let l in element.language) {
        const span = document.createElement("span");
        span.textContent = element.language[l];
        span.classList.add("badge");
        span.classList.add("rounded-pill");

        switch (element.language[l]) {
          case "EN":
            span.classList.add("bg-primary");
            break;
          case "FR":
            span.classList.add("bg-secondary");
            break;
          case "ES":
            span.classList.add("bg-success");
            break;
          case "AR":
            span.classList.add("bg-warning");
            break;
          case "ZH":
            span.classList.add("bg-danger");
            break;
          case "RU":
            span.classList.add("bg-dark");
            break;
          case "DE":
            span.classList.add("bg-info");
            break;
          default:
            break;
        }

        col_3.appendChild(span);
      }
      col_3.addEventListener("click", (e) => {
        console.log(`Event fired in col3: ${e}`);
      });

      row.appendChild(col_1);
      row.appendChild(col_2);
      row.appendChild(col_3);

      table.appendChild(row);
    });
    txt.value = JSON.stringify(fileObjectArray);
    
  }
}

function setDocSymbol(filename) {
  //remove file extension
  let sym_1 = filename.replace(/\.[^.$]+$/g, "");

  //remove language extension "-[ACEFRSG]$"
  let sym_2 = sym_1.replaceAll(/(-[ACEFRSG])+$/g, "");

  //replaces any underscores or dashes  with slashes
  let sym_3 = sym_2.replaceAll(/-|_/g, "/");

  return sym_3;
}

function setLanguage(filename) {
  //remove file extension
  let a = filename.replace(/\.[^.$]+$/g, "");

  //get language suffix
  let b = a.match(/(-[ACEFRSG])+$/g);

  let lang = [];
  let c = "";

  if (b === null)
    //default to english
    lang.push("EN");
  //parse the text
  else c = b[0].replaceAll(/-/g, ""); //remove dashes
  for (let s of c)
    switch (s) {
      case "A":
        lang.push("AR");
        break;
      case "C":
        lang.push("ZH");
        break;
      case "E":
        lang.push("EN");
        break;
      case "F":
        lang.push("FR");
        break;
      case "G":
        lang.push("DE");
        break;
      case "R":
        lang.push("RU");
        break;
      case "S":
        lang.push("ES");
        break;
      default:
        break;
    }

  return lang;
}
