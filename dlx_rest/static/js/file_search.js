import FileContent from "./filecontent2.js";

//https://stackoverflow.com/questions/56871192/how-to-pass-data-from-flask-to-javascript
 

const preview = document.getElementById("preview");

const apiURL = "/api";

const onloadValues ={};

window.addEventListener('DOMContentLoaded', init);

function init() {
    const form = document.querySelector('[data-calc-form]');
    const textInput = document.querySelector('[name=text]');
    const optionInput = document.getElementById("exact");
    const spinner = document.getElementById("spinner");
    const updateURL = document.getElementById("url");

    form.addEventListener('submit', async(e) => {
        e.preventDefault();

        // Find the actual table already displayed and remove it from the UI
        const myTables= document.getElementById("table_list")
        if (myTables) myTables.remove()

        const text = textInput.value;
        const option = optionInput.checked;
        const url = updateURL.value;

        spinner.classList.remove("visually-hidden");

        const results = await fetchResults(text, option, url);

        preview.append(createFileObjects(results));
        spinner.classList.add("visually-hidden");
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

    table.classList.add("table", "table-sm"); 

    table.setAttribute("id", "table_list");

    preview.appendChild(table);

    const thead = document.createElement("thead");

    table.appendChild(thead); 

    const tbody = document.createElement("tbody");
    table.appendChild(tbody);

    const tr = document.createElement("tr");
 
    thead.appendChild(tr);

    let th_txt = ["Identifier Type", "Identifier Value", "Language(s)", "Action", "Link"];

    for (let t in th_txt) {
        const th = document.createElement("th");
        th.textContent = th_txt[t];
        tr.appendChild(th);
    }

    for (const file of results) {
        fileObjectArray.push(new FileContent(file._id, file.filename, file.identifier_type, file.identifier_value, file.languages, file.uri));
    }

    fileObjectArray.forEach((element) => {
        onloadValues[element.id]=[...element.language]; //copy of current values
 
        var onloadIdentifierType = element.identifierType;
        var onloadIdentifierValue = element.identifierValue;
        const row = document.createElement("tr");

        //column #1 - identifier type
        const col_1 = document.createElement("td");
        const typeGroup = document.createElement("div");
        typeGroup.classList.add("btn-group", "btn-group-sm");
        typeGroup.setAttribute("role", "group");
        typeGroup.style.display = "flex";
        
        // Symbol button
        const btnSymbol = document.createElement("button");
        btnSymbol.type = "button";
        btnSymbol.classList.add("btn", "btn-outline-primary");
        btnSymbol.textContent = "symbol";
        btnSymbol.setAttribute("data-type", "symbol");
        if (element.identifierType === "symbol") {
            btnSymbol.classList.add("active");
        }
        
        // URI button
        const btnUri = document.createElement("button");
        btnUri.type = "button";
        btnUri.classList.add("btn", "btn-outline-primary");
        btnUri.textContent = "uri";
        btnUri.setAttribute("data-type", "uri");
        if (element.identifierType === "uri") {
            btnUri.classList.add("active");
        }
        
        // Button group event handler
        const buttons = [btnSymbol, btnUri];
        buttons.forEach(btn => {
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                // Remove active class from all buttons
                buttons.forEach(b => b.classList.remove("active"));
                // Add active class to clicked button
                this.classList.add("active");
                
                const typeChanged = onloadIdentifierType != this.getAttribute("data-type");
                const valueChanged = onloadIdentifierValue != element.identifierValue;
                if (typeChanged || valueChanged) {
                    SaveButtonColor(save_btn);
                } else {
                    SaveButtonDeColor(save_btn);
                }
                element.updateIdentifierType(this.getAttribute("data-type"));
            });
        });
        
        typeGroup.appendChild(btnSymbol);
        typeGroup.appendChild(btnUri);
        col_1.appendChild(typeGroup);

        //column #2 - identifier value
        const col_2 = document.createElement("td");
        col_2.textContent = element.identifierValue;
        col_2.setAttribute("contenteditable", true);
        col_2.setAttribute("title", "Click to edit the identifier value");
        col_2.style.cursor = "text";
        col_2.style.wordBreak = "break-all";
        col_2.addEventListener("input", function(e) {
            const typeChanged = onloadIdentifierType != element.identifierType;
            const valueChanged = onloadIdentifierValue != this.textContent;
            if (typeChanged || valueChanged) {
                SaveButtonColor(save_btn);
            } else {
                SaveButtonDeColor(save_btn);
            }
            element.updateIdentifierValue(this.textContent);
        });

        //column #3 - language
        const col_3 = document.createElement("td");
        const lang_div = document.createElement("div");
        //English
        const span_e = languagePill(onloadValues, element, "EN", "outlined-primary", "bg-primary");
        lang_div.appendChild(span_e);

        //French
        const span_f = languagePill(onloadValues, element, "FR", "outlined-primary", "bg-secondary");
        lang_div.appendChild(span_f);

        //Spanish
        const span_s = languagePill(onloadValues, element, "ES", "outlined-primary", "bg-success");
        lang_div.appendChild(span_s);

        //Arabic
        const span_a = languagePill(onloadValues, element, "AR", "outlined-primary", "bg-warning");
        lang_div.appendChild(span_a);

        //Chinese
        const span_c = languagePill(onloadValues, element, "ZH", "outlined-primary", "bg-danger");
        lang_div.appendChild(span_c);

        //Russian
        const span_r = languagePill(onloadValues, element, "RU", "outlined-primary", "bg-dark");
        lang_div.appendChild(span_r);

        //German
        const span_g = languagePill(onloadValues, element, "DE", "outlined-primary", "bg-info");
        lang_div.appendChild(span_g);

        col_3.appendChild(lang_div);

        for (let l in element.language) {
            switch (element.language[l]) {
                case "EN":
                    span_e.classList.replace("outlined-primary", "bg-primary");
                    break;
                case "FR":
                    span_f.classList.replace("outlined-primary", "bg-secondary");
                    break;
                case "ES":
                    span_s.classList.replace("outlined-primary", "bg-success");
                    break;
                case "AR":
                    span_a.classList.replace("outlined-primary", "bg-warning");
                    break;
                case "ZH":
                    span_c.classList.replace("outlined-primary", "bg-danger");
                    break;
                case "RU":
                    span_r.classList.replace("outlined-primary", "bg-dark");
                    break;
                case "DE":
                    span_g.classList.replace("outlined-primary", "bg-info");
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

        let icon = document.createElement("i");
        icon.classList.add("bi", "bi-save");


        save_btn.append(icon);
        save_btn.innerHTML = " Save";


        save_btn.onclick = function() {
            const record = new FormData();
            record.append('record_id', element.id);
            record.append('identifier_type', element.identifierType);
            record.append('identifier_value', element.identifierValue);
            
            let langs = element.language;
            langs.forEach(l => record.append('lang', l));

            let updateURL = document.getElementById("url").value;
            let myUpdateUrl = updateURL.replace("/results", "");
            
            // Change button to show loading state
            save_btn.disabled = true;
            const originalContent = save_btn.innerHTML;
            save_btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
            
            fetch(myUpdateUrl, {
                method: 'post',
                body: record
            })
            .then(response => response.json())
            .then(data => {
                if (data.updated) {
                    // Success - update the stored values
                    onloadIdentifierType = element.identifierType;
                    onloadIdentifierValue = element.identifierValue;
                    onloadValues[element.id] = [...element.language];
                    
                    // Show success feedback
                    save_btn.classList.replace("btn-success", "btn-outline-success");
                    save_btn.innerHTML = '<i class="bi bi-check-circle"></i> Saved';
                    save_btn.disabled = false;
                    
                    // Revert to normal state after 2 seconds
                    setTimeout(() => {
                        save_btn.classList.replace("btn-outline-success", "btn-outline-secondary");
                        save_btn.innerHTML = originalContent;
                        SaveButtonDeColor(save_btn);
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Update failed');
                }
            })
            .catch(error => {
                // Show error feedback
                save_btn.classList.add("btn-danger");
                save_btn.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Error';
                save_btn.disabled = false;
                console.error('Error updating file:', error);
                
                // Revert to normal state after 3 seconds
                setTimeout(() => {
                    save_btn.classList.remove("btn-danger");
                    save_btn.innerHTML = originalContent;
                    save_btn.disabled = false;
                }, 3000);
            });
        };


        col_4.append(save_btn);

        //column #5 - link to see the file
        /* 
        Split the URI to get the file ID, which we will construct via API
        */
        const fileId = element.uri.split("/").pop();
        const col_5 = document.createElement("td");
        const docLink = document.createElement("a");
        docLink.classList.add("bi", "bi-link-45deg");
        docLink.style.color = "green";
        docLink.href = `${apiURL}/files/${fileId}?action=open`;
        docLink.setAttribute('target', '_blank');

        // add the link only if the data is provided
        if (element.uri) col_5.append(docLink);

        row.appendChild(col_1);
        row.appendChild(col_2);
        row.appendChild(col_3);
        row.appendChild(col_4);
        row.appendChild(col_5);

        tbody.appendChild(row);

    });

    return (table);
}



function languagePill(onloadValues, element, lang, outline_color, bg_color) {
    const span_element = document.createElement("span");
    span_element.classList.add("badge", "rounded-pill", outline_color);
    span_element.textContent = lang;
 
    span_element.addEventListener("click", function(e) {
      
        var row = this.closest("tr");
        var save_btn = row.querySelector(".btn");

        if (this.classList.contains(outline_color) == true) {
            this.classList.replace(outline_color, bg_color);
            element.addLanguage(this.textContent);
        } else {
            this.classList.replace(bg_color, outline_color);
            element.removeLanguage(this.textContent);
        } 
        
        var commonelements = onloadValues[element.id].filter(item => element.language.includes(item));

 
        if (commonelements.length === onloadValues[element.id].length && onloadValues[element.id].length === element.language.length) {
            SaveButtonDeColor(save_btn);
        } else {
            SaveButtonColor(save_btn); 
        }

        
      
    });


    return span_element;
}

function SaveButtonColor(save_btn) {
    if (save_btn.classList.contains("btn-outline-secondary")) {
        save_btn.classList.replace("btn-outline-secondary", "btn-success");
        save_btn.classList.remove("white-button");
        save_btn.classList.add("green-button");
    }
}

function SaveButtonDeColor(save_btn) {
    save_btn.classList.replace("btn-success", "btn-outline-secondary");
    save_btn.classList.remove("green-button");
    save_btn.classList.add("white-button");

}
