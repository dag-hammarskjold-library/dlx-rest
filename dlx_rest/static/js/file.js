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
    table.classList.add("table", "table-sm", "table-hover");

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

    fileObjectArray.forEach((element) => {
      const row = document.createElement("tr");

      //column #1 - name of each file
      const col_1 = document.createElement("td");
      col_1.textContent = element.name;

      //column #2 - document symbol
      const col_2 = document.createElement("td");
      col_2.textContent = element.docSymbol;
      col_2.setAttribute("id", element.id); //new
      col_2.setAttribute("contenteditable", true); //new

      col_2.addEventListener("blur", function (e) {
        element.updateSymbol(this.textContent);
        txt.value = JSON.stringify(fileObjectArray);
      });

      //column #3 - language
      const col_3 = document.createElement("td");
      const lang_div = document.createElement("div");
      //English
      const span_e = document.createElement("span");
      span_e.classList.add("badge", "rounded-pill", "outlined-primary");
      span_e.textContent = "EN";

      span_e.addEventListener("click", function (e) {
        if (this.classList.contains("outlined-primary") == true) {
          this.classList.replace("outlined-primary", "bg-primary");
          element.addLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        } else {
          this.classList.replace("bg-primary", "outlined-primary");
          element.removeLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        }
      });

      lang_div.appendChild(span_e);

      //French
      const span_f = document.createElement("span");
      span_f.classList.add("badge", "rounded-pill", "outlined-secondary");
      span_f.textContent = "FR";

      span_f.addEventListener("click", function (e) {
        if (this.classList.contains("outlined-secondary") == true) {
          this.classList.replace("outlined-secondary", "bg-secondary");
          element.addLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        } else {
          this.classList.replace("bg-secondary", "outlined-secondary");
          element.removeLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        }
      });

      lang_div.appendChild(span_f);

      //Spanish
      const span_s = document.createElement("span");
      span_s.classList.add("badge", "rounded-pill", "outlined-success");
      span_s.textContent = "ES";

      span_s.addEventListener("click", function (e) {
        if (this.classList.contains("outlined-success") == true) {
          this.classList.replace("outlined-success", "bg-success");
          element.addLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        } else {
          this.classList.replace("bg-success", "outlined-success");
          element.removeLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        }
      });

      lang_div.appendChild(span_s);

      //Arabic
      const span_a = document.createElement("span");
      span_a.classList.add("badge", "rounded-pill", "outlined-warning");
      span_a.textContent = "AR";

      span_a.addEventListener("click", function (e) {
        if (this.classList.contains("outlined-warning") == true) {
          this.classList.replace("outlined-warning", "bg-warning");
          element.addLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        } else {
          this.classList.replace("bg-warning", "outlined-warning");
          element.removeLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        }
      });

      lang_div.appendChild(span_a);

      //Chinese
      const span_c = document.createElement("span");
      span_c.classList.add("badge", "rounded-pill", "outlined-danger");
      span_c.textContent = "ZH";

      span_c.addEventListener("click", function (e) {
        if (this.classList.contains("outlined-danger") == true) {
          this.classList.replace("outlined-danger", "bg-danger");
          element.addLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        } else {
          this.classList.replace("bg-danger", "outlined-danger");
          element.removeLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        }
      });

      lang_div.appendChild(span_c);

      //Russian
      const span_r = document.createElement("span");
      span_r.classList.add("badge", "rounded-pill", "outlined-dark");
      span_r.textContent = "RU";

      span_r.addEventListener("click", function (e) {
        if (this.classList.contains("outlined-dark") == true) {
          this.classList.replace("outlined-dark", "bg-dark");
          element.addLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        } else {
          this.classList.replace("bg-dark", "outlined-dark");
          element.removeLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        }
      });

      lang_div.appendChild(span_r);

      //German
      const span_g = document.createElement("span");
      span_g.classList.add("badge", "rounded-pill", "outlined-info");
      span_g.textContent = "DE";

      span_g.addEventListener("click", function (e) {
        if (this.classList.contains("outlined-info") == true) {
          this.classList.replace("outlined-info", "bg-info");
          element.addLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        } else {
          this.classList.replace("bg-info", "outlined-info");
          element.removeLanguage(this.textContent);
          txt.value = JSON.stringify(fileObjectArray);
        }
      });

      lang_div.appendChild(span_g);

      col_3.appendChild(lang_div);

      for (let l in element.language) {
        switch (element.language[l]) {
          case "EN":
            span_e.classList.replace("outlined-primary", "bg-primary");
            break;
          case "FR":
            span_f.classList.replace("outlined-secondary", "bg-secondary");
            break;
          case "ES":
            span_s.classList.replace("outlined-success", "bg-success");
            break;
          case "AR":
            span_a.classList.replace("outlined-warning", "bg-warning");
            break;
          case "ZH":
            span_c.classList.replace("outlined-danger", "bg-danger");
            break;
          case "RU":
            span_r.classList.replace("outlined-dark", "bg-dark");
            break;
          case "DE":
            span_g.classList.replace("outline-info", "bg-info");
            break;
          default:
            break;
        }
      }
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
  let sym_2 = sym_1.replaceAll(/(-[ACEFRSGZD][A-Z]?)+$/g, ""); //

  //replaces any underscores or dashes  with slashes
  let sym_3 = sym_2.replaceAll(/-|_/g, "/");

  return sym_3;
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
