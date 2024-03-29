class FileContent {
    constructor(
            // Parameters
            id,
            filename,
            langs
        ) {
            // Properties
            this.id = id;
            this.filename = filename;
            this.docSymbol = this.setDocSymbol(filename);
            this.en = { //English
                selected: langs.find(element => element === "EN") ? true : false,
                className: langs.find(element => element === "EN") ? "bg-primary" : "outlined-primary"
            };
            this.fr = { //French
                selected: langs.find(element => element === "FR") ? true : false,
                className: langs.find(element => element === "FR") ? "bg-secondary" : "outlined-primary"
            };
            this.es = { //Spanish
                selected: langs.find(element => element === "ES") ? true : false,
                className: langs.find(element => element === "ES") ? "bg-success" : "outlined-primary"
            };
            this.ar = { //Arabic
                selected: langs.find(element => element === "AR") ? true : false,
                className: langs.find(element => element === "AR") ? "bg-warning" : "outlined-primary"
            };
            this.zh = { //Chinese
                selected: langs.find(element => element === "ZH") ? true : false,
                className: langs.find(element => element === "ZH") ? "bg-danger" : "outlined-primary"
            };
            this.ru = { //Russian
                selected: langs.find(element => element === "RU") ? true : false,
                className: langs.find(element => element === "RU") ? "bg-dark" : "outlined-primary"
            };
            this.de = { //German
                selected: langs.find(element => element === "DE") ? true : false,
                className: langs.find(element => element === "DE") ? "bg-info" : "outlined-primary"
            };
            this.overwrite = false; //default

        }
        // Methods
    setDocSymbol(filename) {
        //remove file extension
        let sym_1 = filename.replace(/\.[^.$]+$/g, "");

        //remove language extension
        let sym_2 = sym_1.replaceAll(/(-[ACEFRSGZD][A-Z]?)+$/g, ""); 

        //replaces any underscores or dashes  with slashes
        //let sym_3 = sym_2.replaceAll(/-|_/g, "/");
        let sym_3 = sym_2.replaceAll(/_/g, "/");

        return sym_3;
    }
    updateSymbol(symbol) {
        this.docSymbol = symbol;
    }
    updateLangEN() {
        if (this.en.selected == true) {
            this.en.selected = false;
            this.en.className = "outlined-primary"
        } else {
            this.en.selected = true;
            this.en.className = "bg-primary"
        }
    }
    updateLangFR() {
        if (this.fr.selected == true) {
            this.fr.selected = false;
            this.fr.className = "outlined-primary"
        } else {
            this.fr.selected = true;
            this.fr.className = "bg-secondary"
        }
    }
    updateLangES() {
        if (this.es.selected == true) {
            this.es.selected = false;
            this.es.className = "outlined-primary"
        } else {
            this.es.selected = true;
            this.es.className = "bg-success"
        }
    }
    updateLangAR() {
        if (this.ar.selected == true) {
            this.ar.selected = false;
            this.ar.className = "outlined-primary"
        } else {
            this.ar.selected = true;
            this.ar.className = "bg-warning"
        }
    }
    updateLangZH() {
        if (this.zh.selected == true) {
            this.zh.selected = false;
            this.zh.className = "outlined-primary"
        } else {
            this.zh.selected = true;
            this.zh.className = "bg-danger"
        }
    }
    updateLangRU() {
        if (this.ru.selected == true) {
            this.ru.selected = false;
            this.ru.className = "outlined-primary"
        } else {
            this.ru.selected = true;
            this.ru.className = "bg-dark"
        }
    }
    updateLangDE() {
        if (this.de.selected == true) {
            this.de.selected = false;
            this.de.className = "outlined-primary"
        } else {
            this.de.selected = true;
            this.de.className = "bg-info"
        }
    }
    updateOverwrite(action) {
            if (action == "keep") {
                this.overwrite = false;
            } else {
                this.overwrite = true
            }
        }
}

export default FileContent;