/*
 ** Class for files
 */

class FileContent {
    constructor(
            // Parameters
            id,
            name,
            identifierType,
            identifierValue,
            language,
            uri
        ) {
            // Properties
            this.id = id;
            this.name = name;
            this.identifierType = identifierType;
            this.identifierValue = identifierValue;
            this.language = language;
            this.uri = uri;
        }
        // Methods
    updateIdentifierType(identifierType) {
        this.identifierType = identifierType;
    }
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