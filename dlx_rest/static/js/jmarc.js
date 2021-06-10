"use strict";

const nodejs = typeof window === "undefined" ? true : false;

if (nodejs) {
	// fetch is not built into node
	var fetch = require('node-fetch');
}

(
	function(exports) {
	
		class Subfield {
			constructor(code, value, xref) {
				this.code = code;
				this.value = value;
				this.xref = xref;
				
				this.saved = false;
			}
		}
		
		class ControlField {
			constructor(tag, value) {
				if (tag) {
					! tag.match(/^00/) && function() {throw new Error("invalid Control Field tag")};
				}
				
				this.tag = tag;
				this.value = value;
			}
		}
		
		class DataField {
			constructor(tag, indicators, subfields) {
				if (tag) {
					tag.match(/^00/) && function() {throw new Error("invalid Data Field tag")};
				}
				
				indicators ||= [" ", " "];
				
				this.tag = tag;
				this.indicators = indicators || [];
				this.subfields = subfields || [];
			}
			
			createSubfield(code) {
				code || function() {throw new Error("subfield code required")};
				
				let subfield = new Subfield(code);
				this.subfields.push(subfield);
				
				return subfield;
			}
			
			getSubfields(code) {
				return this.subfields.filter(x => x.code == code);
			}
			
			getSubfield(code, place) {
				return this.getSubfields(code)[place || 0];
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
		}
		
		class Jmarc {
			constructor(collection) {
				Jmarc.apiUrl || function() {throw new Error("Jmarc.apiUrl must be set")};
				this.collection = collection || function() {throw new Error("Collection required")};
				this.collectionUrl = Jmarc.apiUrl + `/marc/${collection}`;
				this.recordId = null;
				this.fields = [];
				this.saved = false;
			}
			
			static get(collection, recordId) {
				Jmarc.apiUrl || function() {throw new Error("Jmarc.apiUrl must be set")};
				
				let jmarc = new Jmarc(collection || function() {throw new Error("Collection required")});
				jmarc.recordId = parseInt(recordId) || function() {throw new Error("Record ID required")};
				jmarc.url = Jmarc.apiUrl + `/marc/${collection}/records/${recordId}`;
				
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
						
						return jmarc.parse(json['data']);
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
						this.saved = true;
						
						return this
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
						
						this.saved = true;
					
						return this
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

			parse(data) {
				this.updated = data['updated']
				
				let tags = Object.keys(data).filter(x => x.match(/^\d{3}/));
				
				for (let tag of tags) {
					for (let field of data[tag]) {
						if (tag.match(/^00/)) {
							let cf = new ControlField(tag, field);
							this.fields.push(cf)
						} else {
							let df = new DataField(tag);
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
			
			stringify() {
				let recordData = {'_id': this.recordId, 'updated': this.updated};
				let tags = Array.from(new Set(this.fields.map(x => x.tag)));
		
				for (let tag of tags.sort(x => parseInt(x))) {
					let fieldData = {};
					recordData[tag] = recordData[tag] || [];
					
					for (let field of this.getFields(tag)) {
						if (field.constructor.name == 'ControlField') {
							recordData[tag].push(field.value);
						} else {
							fieldData['indicators'] = field.indicators;
							fieldData['subfields'] = field.subfields.map(x => {return {'code': x.code, 'value': x.value, 'xref': x.xref}})
						}
						
						recordData[tag].push(fieldData);
					}
				}
		
				return JSON.stringify(recordData)
			}
			
			createField(tag) {
				tag || function() {throw new Error("tag required")};
				
				let field = tag.match(/^00/) ? new ControlField(tag) : new DataField(tag);
				this.fields.push(field);
				
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
			
			getSubfield(tag, code, tagPlace, codePlace) {
				let field = this.getField(tag, tagPlace);
				
				if (field) {
					return field.getSubfield(code, codePlace);
				}
				
				return
			}
		}
		
		class Bib extends Jmarc {
			constructor() {
				super("bibs");
			}
		}
		
		class Auth extends Jmarc {
			constructor() {
				super("auths");
			}
		
		}

		exports.Jmarc = Jmarc;
		exports.Bib = Bib;
		exports.Auth = Auth;
		exports.ControlField = ControlField;
		exports.DataField = DataField;
		exports.Subfield = Subfield;
	}
)

(
	nodejs ? exports : this['jmarcjs'] = {}
)
