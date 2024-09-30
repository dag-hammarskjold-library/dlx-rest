/* CSV parser and writer */

//import {Jmarc} from "./jmarc.mjs" */

export class CSV {
    constructor() {
        this._header = new Set();
        this.data = {};
    }

    get header() {
        return Array.from(this._header).sort(sortCSVHeader)
    }

    get rows() {
        const rows = [];

        for (const [i, data] of Object.entries(this.data)) {
            rows.push(this.header.map(field => this.data[i][field] || ""))
        } 

        return rows
    }

    parseText(text) {
        // Ingest a CSV from a single string. The CSV is expected to have a 
        // header row. Double quotes are not parsed here.

        const lines = text.split("\n");
        const header = parseCSVLine(lines.shift());
        header.forEach(x => this._header.add(x));
        
        for (let [i, line] of lines.entries()) {
            i = Object.keys(this.data).length + i;

            for (let [j, value] of parseCSVLine(line).entries()) {
              this.data[i] = this.data[i] ? this.data[i] : {};
              this.data[i][header[j]] = value;
            }
        } 
    }

    toString() {
        // Serialize the data back into a CSV string.

        let buffer = this.header.join(",") + "\n";
        
        for (let row of this.rows) {
            let esacapedRow = row.map(value => {
                if (value.includes(",") || value.includes('"')) {
                    value = '"' + value.replaceAll('"', '""') + '"';   
                }

                return value
            });

            buffer += esacapedRow.join(",") + "\n";
        }
        
        return buffer
    }

}

function parseCSVLine(line) {
    const triple = '\u2083';
    const double = '\u2082';
    const single = '\u2081';
    line = line.replaceAll('"""', triple);
    line = line.replaceAll('""', double);
    line = line.replaceAll('"', single);
    const values = [];
    let buffer = "";
    let inQuotes = false;

    for (const char of line) {
        if (char === single || char === triple) {
            inQuotes = ! inQuotes;
        }

        if (char === "," && inQuotes ===  false) {
            buffer = buffer.replaceAll(single, "").replaceAll(double, '"').replaceAll(triple, '"');
            values.push(buffer);
            buffer = "";
            continue
        }

        buffer += char
    }

    return values
}

function getHeaderTag(string) {return string.match(/\d\.(\d+)/)[1]}
function getHeaderPlace(string) {return string.match(/^\d+/)[0]}
function getHeaderSub(string) {return (string.match(/\$(\w)$/) || [])[1]}

function sortCSVHeader(a, b) {
    if (getHeaderTag(a) === getHeaderTag(b)) {
        if (getHeaderPlace(a) === getHeaderPlace(b)) {
            if (getHeaderSub(a) === getHeaderSub(b)) return 0
  
            return getHeaderSub(a) > getHeaderSub(b) ? 1 : -1
        } else {
            return parseInt(getHeaderPlace(a)) > parseInt(getHeaderPlace(b)) ? 1 : -1
        }
    } else {
        return getHeaderTag(a) > getHeaderTag(b) ? 1 : -1
    }
}