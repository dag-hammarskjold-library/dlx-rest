import FileContent from "./filecontent.js";

//https://stackoverflow.com/questions/56871192/how-to-pass-data-from-flask-to-javascript


const preview = document.getElementById("preview");

window.addEventListener('DOMContentLoaded', init);

function init() {
    const form = document.querySelector('[data-calc-form]');
    const textInput = document.querySelector('[name=text]');
    const optionInput = document.getElementById("exact");
    const spinner = document.getElementById("spinner");
    const updateURL = document.getElementById("url");

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const text = textInput.value;
        const option = optionInput.checked;
        const url = updateURL.value;

        spinner.classList.remove("visually-hidden")

        const results = await fetchResults(text, option, url);

        preview.append(createFileObjects(results))
        spinner.classList.add("visually-hidden")
    });
}

async function fetchResults(text, option, url) {
    const payload = new FormData();
    payload.append('text', text);
    payload.append('exact', option);

    const res = await fetch(url, {
        method: 'post',
        body: payload
    });
    const estimation = await res.json();
    return estimation;
}

// end script

/* For each file added to the drag/drop or browse, create a file object*/
function createFileObjects(results) {

  //still need to figure out how to clear the table

  const fileObjectArray = [];
  
  const table = document.createElement("table");
  table.classList.add("table", "table-sm", "table-hover");
  table.setAttribute("id", "table_list")

  preview.appendChild(table);

  const thead = document.createElement("thead");

  table.appendChild(thead);

  const tr = document.createElement("tr");

  thead.appendChild(tr);

  let th_txt = ["File Name", "Document Symbol", "Language(s)", ""];

  for (let t in th_txt) {
    const th = document.createElement("th");
    th.textContent = th_txt[t];
    tr.appendChild(th);
  }

  for (const file of results) {
    fileObjectArray.push(new FileContent(file._id, file.filename, file.docsymbol, file.languages));
  }

  fileObjectArray.forEach((element) => {
    const row = document.createElement("tr");

    //column #1 - name of each file
    const col_1 = document.createElement("td");
    col_1.textContent = element.name;

    //column #2 - document symbol
    const col_2 = document.createElement("td");
    col_2.textContent = element.docSymbol;
    col_2.setAttribute("contenteditable", true); //new

    col_2.addEventListener("blur", function (e) {
      element.updateSymbol(this.textContent);

    });

    //column #3 - language
    const col_3 = document.createElement("td");
    const lang_div = document.createElement("div");
    //English
    const span_e = languagePill(element, "EN", "outlined-primary", "bg-primary");
    lang_div.appendChild(span_e);

    //French
    const span_f = languagePill(element, "FR", "outlined-secondary", "bg-secondary");
    lang_div.appendChild(span_f);

    //Spanish
    const span_s = languagePill(element, "ES", "outlined-success", "bg-success");
    lang_div.appendChild(span_s);

    //Arabic
    const span_a = languagePill(element, "AR", "outlined-warning", "bg-warning");
    lang_div.appendChild(span_a);

    //Chinese
    const span_c = languagePill(element, "ZH", "outlined-danger", "bg-danger");
    lang_div.appendChild(span_c);

    //Russian
    const span_r = languagePill(element, "RU", "outlined-dark", "bg-dark");
    lang_div.appendChild(span_r);

    //German
    const span_g = languagePill(element, "DE", "outlined-info", "bg-info");
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
          span_g.classList.replace("outlined-info", "bg-info");
          break;
        default:
          break;
      }
    }


    //column #4 - Save row
    const col_4 = document.createElement("td");
    let save_btn = document.createElement("button");
    save_btn.classList.add("btn", "btn-outline-secondary");
    save_btn.setAttribute("id", element.id);

    let icon = document.createElement("i")
    icon.classList.add("bi", "bi-save")

    save_btn.append(icon)
    // save_btn.innerHTML = "Save";
    save_btn.onclick =  function () {

      const record = new FormData();
      record.append('record_id', element.id);
      record.append('docsymbol', element.docSymbol);

      let langs =  element.language;
      langs.forEach(l => record.append('lang', l));
      

      const res = fetch('/files/update', {
          method: 'post',
          body: record
      });

    };

    col_4.append(save_btn)

    row.appendChild(col_1);
    row.appendChild(col_2);
    row.appendChild(col_3);
    row.appendChild(col_4);

    table.appendChild(row);

  });

  return table;
}

function languagePill(element, lang, outline_color, bg_color) {
  const span_element = document.createElement("span");
  span_element.classList.add("badge", "rounded-pill", outline_color);
  span_element.textContent = lang;

  span_element.addEventListener("click", function (e) {
      if (this.classList.contains(outline_color) == true) {
        this.classList.replace(outline_color, bg_color);
        element.addLanguage(this.textContent);
      } else {
        this.classList.replace(bg_color, outline_color);
        element.removeLanguage(this.textContent);
      }
    });
  return span_element;
}
