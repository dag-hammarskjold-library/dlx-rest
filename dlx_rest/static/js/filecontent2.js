/*
 ** Class for files
 */

class FileContent {
    constructor(
            // Parameters
            id,
            name,
            docSymbol,
            language,
            uri
        ) {
            // Properties
            this.id = id;
            this.name = name;
            this.docSymbol = docSymbol;
            this.language = language;
            this.uri = uri;
        }
        // Methods
    updateSymbol(symbol) {
        this.docSymbol = symbol;
    }
    addLanguage(l) {
        this.language.push(l);
    }
    removeLanguage(l) {
        let pos = this.language.indexOf(l);
        this.language.splice(pos, 1);
    }
}

export default FileContent;