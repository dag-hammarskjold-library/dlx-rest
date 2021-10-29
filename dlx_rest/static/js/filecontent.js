/*
 ** Class for files
 */

 class FileContent {
  constructor(
    // Parameters
    id,
    name,
    docSymbol,
    language
  ) {
    // Properties
    this.id = id;
    this.name = name;
    this.docSymbol = docSymbol;
    this.language = language;
    this.uploadStatus = "";
  }
  // Methods
  updateSymbol(symbol) {
    this.docSymbol = symbol;
  }
  updateLanguage(l) {
    this.language = l;
  }
  updateStatus(s) {
    this.updateStatus = s;
  }
}

export default FileContent;
