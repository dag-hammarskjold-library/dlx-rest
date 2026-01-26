/*
 ** Class for files
 */

class FileContent {
    constructor(
            // Parameters
            id,
            name,
            identifierValue,
            language,
            uri
        ) {
            // Properties
            this.id = id;
            this.name = name;
            this.identifierValue = identifierValue;
            this.language = language;
            this.uri = uri;
        }
        // Methods
    updateIdentifierValue(identifierValue) {
        this.identifierValue = identifierValue;
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