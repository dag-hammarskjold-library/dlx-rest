"use strict";
	
const authMap = {
	"bibs": {
		'191': {'b': '190', 'c': '190'},
		'600': {'a': '100', 'g': '100'},
		'610': {'a': '110', 'g': '110'},
		'611': {'a': '111', 'g': '111'},
		'630': {'a': '130', 'g': '130'},
		'650': {'a': '150'},
		'651': {'a': '151'},
		'700': {'a': '100', 'g': '100'},
		'710': {'a': '110', '9': '110'},
		'711': {'a': '111', 'g': '111'},
		'730': {'a': '130'},
		'791': {'b': '190', 'c' : '190'},
		'830': {'a': '130'},
		'991': {'a': '191', 'b': '191', 'c': '191', 'd': '191'}
	},
	"auths": {
		//'491': {'a': '191'}, # ?
		'500': {'a': '100'},
		'510': {'a': '110'},
		'511': {'a': '111'},
		'550': {'a': '150'},
		'551': {'a': '151'},
	}
};

export class Subfield {
	constructor(code, value, xref) {
		this.code = code;
		this.value = value;
		this.xref = xref;	
	}
}

class LinkedSubfield extends Subfield {
	constructor(code, value, xref) {
		super(code, value);
		this.xref = xref;
	}
}

export class ControlField {
	constructor(tag, value) {
		if (tag) {
			! tag.match(/^00/) && function() {throw new Error("invalid Control Field tag")};
		}
		
		this.tag = tag;
		this.value = value;
	}
}

export class DataField {
	constructor(tag, indicators, subfields) {
		if (tag) {
			tag.match(/^00/) && function() {throw new Error("invalid Data Field tag")};
		}
		
		indicators ||= [" ", " "];
		
		this.tag = tag;
		this.indicators = indicators || [];
		this.subfields = subfields || [];
	}
	
	createSubfield(code, place) {
		let subfield = new Subfield(code);
		
        if (place) {
            this.subfields.splice(place, 0, subfield);
        }
        else {
            this.subfields.push(subfield);
        }
		
		return subfield;
	}
	
	getSubfields(code) {
		return this.subfields.filter(x => x.code == code);
	}
	
	getSubfield(code, place) {
		return this.getSubfields(code)[place || 0];
	}
	
	deleteSubfield(subfieldOrCode, place) {
	    if (subfieldOrCode instanceof Subfield) {
	        let subfield = subfieldOrCode;
            this.subfields = this.subfields.filter(x => x !== subfield)
	    } else {
	        let code = subfieldOrCode;
            
            if (place) {
                let subfield = this.getSubfield(code, place);
                this.deleteSubfield(subfield);
            } else {
                this.subfields = this.subfields.filter(x => x.code !== code)
            }
	    }
	}
    
    toStr() {
		let str = ""
		
		for (let subfield of this.subfields) {
			str += `\$${subfield.code} ${subfield.value} `;
			
			if (subfield.xref) {
				str += `@${subfield.xref} `;
			}
			
			str += '|';
		}
		
		return str
	}
	
	lookup() {
		let collection = this instanceof BibDataField ? "bibs" : "auths";
		let lookupString = this.subfields.map(x => {return `${x.code}=${x.value}`}).join("&");
		let url = Jmarc.apiUrl + `marc/${collection}/lookup/${this.tag}?${lookupString}`;
		
		return fetch(url).then(
			response => {
				return response.json()
			}
		).then(
			json => {
				let results = json['data'];
				let choices = [];
				
				for (let auth of results) {
					// each result is a record
					// the wanted auth field is the only 1XX field
					for (let tag of Object.keys(auth).filter(x => x.match(/^1\d\d/))) {
						let field = this instanceof BibDataField ? new BibDataField(this.tag) : new AuthDataField(this.tag);
						
						for (let sf of auth[tag][0]['subfields']) {
							field.subfields.push(new Subfield(sf['code'], sf['value'], auth['_id']));
						}
						
						choices.push(field)
					}
				}
				
				return choices
			}
		)
	}
}

class BibDataField extends DataField {
	constructor(tag, indicators, subfields) {
		super(tag, indicators, subfields)
	}
}

class AuthDataField extends DataField {
	constructor(tag, indicators, subfields) {
		super(tag, indicators, subfields)
	}
}

export class Jmarc {
	constructor(collection) {
		Jmarc.apiUrl || function() {throw new Error("Jmarc.apiUrl must be set")};
		Jmarc.apiUrl = Jmarc.apiUrl.slice(-1) == '/' ? Jmarc.apiUrl : Jmarc.apiUrl + '/';
		
		this.collection = collection || function() {throw new Error("Collection required")};
		this.recordClass = collection === "bibs" ? Bib : Auth;
		this.collectionUrl = Jmarc.apiUrl + `marc/${collection}`;
		this.recordId = null;
		this.fields = [];
		this._history = [];
	}
	
	isAuthorityControlled(tag, code) {
		let map = authMap;
		
		if (map[this.collection][tag] && map[this.collection][tag][code]) {
			return true
		}
		
		return false
	}
	
	static get(collection, recordId) {
		Jmarc.apiUrl || function() {throw new Error("Jmarc.apiUrl must be set")};
		Jmarc.apiUrl = Jmarc.apiUrl.slice(-1) == '/' ? Jmarc.apiUrl : Jmarc.apiUrl + '/';
		
		let jmarc = new Jmarc(collection || function() {throw new Error("Collection required")});
		jmarc.recordId = parseInt(recordId) || function() {throw new Error("Record ID required")};
		jmarc.url = Jmarc.apiUrl + `marc/${collection}/records/${recordId}`;
		
		let savedResponse;
		
		return fetch(jmarc.url).then(
			response => {
				savedResponse = response;
				
				return response.json()
			}
		).then(
			json => {
				if (savedResponse.status != 200) {
					throw new Error(json['message'])
				}
				
				jmarc.parse(json['data']);
				jmarc.savedState = jmarc.compile();

				jmarc.files = json['data']['files']
				
				return jmarc
			}
		)
	}
	
	static listWorkforms(collection) {
	    return fetch(Jmarc.apiUrl + `marc/${collection}/workforms`).then(
	        response => {
	            return response.json()
	        }
	    ).then(
	        json => {
                let names = [];
                
	            for (let url of json['data']) {
                    let wname = url.split("/").slice(-1)[0];
                    wname = decodeURIComponent(wname)
	                names.push(wname)
	            }
                
                return names
	        }
	    )
	}
    
    static fromWorkform(collection, workformName) {
	    let jmarc = new Jmarc(collection);
        
        return fetch(jmarc.collectionUrl + '/workforms/' + workformName).then(
            response => {
                if (response.ok) {
                    return response.json()
                } else {
                    throw new Error(`Workform "${workformName}" not found`)
                }
            }
        ).then(
            json => {
                jmarc.parse(json['data']);
                jmarc.workformName = workformName;
                jmarc.workformDescription = json['description']
                
                return jmarc
            }
        )
	}
    
    static deleteWorkform(collection, workformName) {
        let error = false;
        
        return fetch(
            Jmarc.apiUrl + `marc/${collection}/workforms/${workformName}`,
            {method: 'DELETE'}
        ).then(
            response => {
                if (! response.ok) {
                    error = true;
                }
                
                return response.json()
            }
        ).then(
            json => {
                if (error === true) {
                    throw new Error(json['message'])
                }
                
                return true
            }
        )
    }
    
    saveAsWorkform(workformName, description) {
        let data = this.compile()
        data['name'] = workformName;
        data['description'] = description;
        delete data['_id'];
        
        let error = false;
        
        return fetch(
            this.collectionUrl + '/workforms',
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            }
        ).then(
            response => {
                if (! response.ok) {
                    error = true
                } 
                
                return response.json()
            }
        ).then(
            json => {
                if (error === true) {
                    throw new Error(json['message'])
                }
                
                return true
            }
        )
    }
    
    post() {
		if (this.recordId) {
			throw new Error("Can't POST existing record")
		}
		
		let savedResponse;

		return fetch(
			this.collectionUrl + '/records',
			{
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: this.stringify()
			}	
		).then(
			response => {
				savedResponse = response;
				return response.json()
			}
		).then(
			json => {
				if (savedResponse.status != 201) {
					throw new Error(json['message']);
				}
				
				this.url = json['result'];
				this.recordId = parseInt(this.url.split('/').slice(-1));
				this.savedState = this.compile()
				
				return this;
			}
		)
	}

	put() {
		if (! this.recordId) {
			throw new Error("Can't PUT new record")
		}
		
		let savedResponse;
		
		return fetch(
			this.url,
			{
				method: 'PUT',
				headers: {'Content-Type': 'application/json'},
				body: this.stringify()
			}	
		).then(
			response => {
				savedResponse = response;
				
				return response.json();
			}
		).then(
			json => {
				if (savedResponse.status != 200) {
					throw new Error(json['message'])
				}
				
				this.savedState = this.compile();
				
				return this;
			} 
		)
	}
	
	delete() {
		if (! this.recordId) {
			throw new Error("Can't DELETE new record")
		}
		
		let savedResponse;
		
		return fetch(
			this.url,
			{method: 'DELETE'}	
		).then(
			response => {
				if (response.status == 204) {
					this.recordId = null;
					this.url = null;
				
					return this;
				}
				
				return response.json()
			}
		).then(
			check => {
				if (check.constructor.name == "Jmarc") {
					return check
				}
				
				throw new Error(check['message'])
			}
		)
	}

	get saved() {
		return JSON.stringify(this.savedState) === JSON.stringify(this.compile());
	}

	parse(data) {
		this.updated = data['updated'];
		this.user = data['user'];
		
		let tags = Object.keys(data).filter(x => x.match(/^\d{3}/));
		tags = tags.sort((a, b) => parseInt(a) - parseInt(b));
		
		for (let tag of tags) {
			for (let field of data[tag]) {
				if (tag.match(/^00/)) {
					let cf = new ControlField(tag, field);
					this.fields.push(cf)
				} else {
					let df = this.collection == "bibs" ? new BibDataField(tag) : new AuthDataField(tag);
					df.indicators = field.indicators.map(x => x.replace(" ", "_"));
					
					for (let subfield of field.subfields) {
						let sf = new Subfield(subfield.code, subfield.value, subfield.xref);
						df.subfields.push(sf)
					}
					
					this.fields.push(df)
				}
			}
		}
		
		return this		
	}
	
	compile() {
		let recordData = {_id: this.recordId, updated: this.updated, user: this.user};
		let tags = Array.from(new Set(this.fields.map(x => x.tag)));

		for (let tag of tags.sort(x => parseInt(x))) {
			recordData[tag] = recordData[tag] || [];
			
			for (let field of this.getFields(tag)) {
				if (field.constructor.name == 'ControlField') {
					recordData[tag].push(field.value);
				} else {
					let fieldData = {};
					
					fieldData['indicators'] = field.indicators;
					fieldData['subfields'] = field.subfields.map(x => {return {'code': x.code, 'value': x.value, 'xref': x.xref}});
					
					recordData[tag].push(fieldData);
				}
			}
		}

		return recordData
	}
	
	stringify() {
		return JSON.stringify(this.compile())
	}
	
	async history() {
		if (typeof this.url === "undefined") {
			return []
		}
		
		let response = await fetch(this.url + "/history");
		let json = await response.json();
		let data = json['data'];
		let historyRecords = [];
		
		for (let url of data) {
			let record = new Jmarc();
			let response = await fetch(url);
			let json = await response.json();
			record.parse(json['data']);
			historyRecords.push(record);
		}
		
		return historyRecords
	}
	
	clone() {
		let cloned = new this.recordClass;
		cloned.parse(this.compile());
		cloned.deleteField("001");
		cloned.deleteField("005");
		cloned.deleteField("008");
		
		return cloned
	}
	
	createField(tag, place) {
        let field;
		
		if (tag && tag.match(/^00/)) {
			field = new ControlField(tag)
		} 
        else {
			if (this.collection === "bibs") {
				field = new BibDataField(tag)
			} else if (this.collection === "auths") {
				field = new AuthDataField(tag)
			} else {
			    // other record types?
			}
		}
        
        if (field.tag && place) {
            // field place
            let i = 0;
            
            for (let [c, f] of Object.entries(this.fields)) {
                if (f.tag === field.tag) {
                    if (i === place) {
                        this.fields.splice(c, 0, field)
                    }
                              
                    i++;
                } 
            }
        } 
        else if (place) {
            // record place
            this.fields.splice(place, 0, field);
        }
        else {
            this.fields.push(field);
        }
		
		return field
	}
	
	getControlFields() {
		return this.fields.filter(x => x.tag.match(/^0{2}/))
	}
	
	getDataFields() {
		return this.fields.filter(x => ! x.tag.match(/^0{2}/))
	}
	
	getFields(tag) {
		return this.fields.filter(x => x.tag == tag)
	}
	
	getField(tag, place) {
		return this.getFields(tag)[place || 0]
	}
	
	deleteField(tagOrField, place) {
		if (tagOrField instanceof DataField) {
            let field = tagOrField;
		    this.fields = this.fields.filter(x => x !== field);
		} else {
            let tag = tagOrField;
            
            if (place) {
			    let field = this.getField(tag, place);
			    this.deleteField(field);
		    } else {
			    // delete all instances of tag
			    this.fields = this.fields.filter(field => field.tag !== tag);
		    }
	    }
    }
    
	getSubfield(tag, code, tagPlace, codePlace) {
		let field = this.getField(tag, tagPlace);
		
		if (field) {
			return field.getSubfield(code, codePlace);
		}
		
		return
	}
}

export class Bib extends Jmarc {
	constructor() {
		super("bibs");
	}
	
	static get(recordId) {
		return Jmarc.get("bibs", recordId)
	}
	
	validate() {}
}

export class Auth extends Jmarc {
	constructor() {
		super("auths");
	}
			
	static get(recordId) {
		return Jmarc.get("auths", recordId)
	}
			
	validate() {}
}
