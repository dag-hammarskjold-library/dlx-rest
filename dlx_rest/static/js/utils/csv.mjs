/* CSV parser and writer */

import { Jmarc } from "../api/jmarc.mjs";

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
        // header row. Multiple CSVs can be ingested in order to combine the
        // data.

        const lines = text.split("\n").filter(x => x.trim() !== "");
        const header = parseCSVLine(lines.shift());
        header.forEach(x => this._header.add(x));

        if (! header.every(x => x.match(/^\d+\.\d{3}/))) {
            throw Error("First line of data does not look like a valid header")
        }
        
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

    listJmarc(collection) {
        // Return a list of Jmarc objects constructed from the CSV data.
        // todo: handle auth controlled fields. CSV needs subfield $0 for xref
        // todo: support repeated subfields

        let records = [];

        for (const [row, data] of Object.entries(this.data)) {
            const jmarc = new Jmarc(collection=collection);

            for (const [headerField, value] of Object.entries(data)) {
                const tag = getHeaderTag(headerField);
                const place = parseInt(getHeaderPlace(headerField)) - 1;
                const subfieldCode = getHeaderSub(headerField);
                
                let field = jmarc.getField(tag, place);

                if (! field ) {
                    field = jmarc.createField(tag)
                }
                
                if (! tag.match(/^00/)) {
                    // datafield
                    const subfield = field.createSubfield(subfieldCode);

                    if (jmarc.isAuthorityControlled(tag, subfieldCode)) {
                        // todo: get and assign the xref
                        const xref = row[`${place}.${tag}$${subfieldCode}`];

                        if (xref) {
                            subfield.value = xref
                        } else {
                            throw Error(`Xref (subfield $0) not found for auth controlled field ${tag}/${place} in row ${parseInt(row) + 1}`)
                        }

                    } else {
                        subfield.value = value
                    }
                } else {
                    // controlfield
                    field.value = value
                }
            }

            records.push(jmarc)
        }

        return records
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

    values.push(buffer); // capture last column 

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