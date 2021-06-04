'use strict';

const nodejs = typeof window === 'undefined' ? true : false;

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
			}
		}
		
		class ControlField {
			constructor(tag, value) {
				this.tag = tag;
				this.value = value;
			}
		}
		
		class DataField {
			constructor(tag, indicators, subfields) {
				this.tag = tag;
				this.indicators = indicators || [];
				this.subfields = subfields || [];
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
			}
			
			static fromId(collection, recordId) {
				Jmarc.apiUrl || function() {throw new Error("Jmarc.apiUrl must be set")};
				let jmarc = new Jmarc(collection || function() {throw new Error("Collection required")});
				jmarc.recordId = parseInt(recordId) || function() {throw new Error("Record ID required")};
				jmarc.url = Jmarc.apiUrl + `/marc/${collection}/records/${recordId}`;
				
				// returns a Promise of the Jmarc object
				return jmarc.get(jmarc.url).then(jmarc => {return jmarc})
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
			
			// accessors 
			
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
			
			setSubfield(tag, code, value, tagPlace, codePlace) {
				let field = this.getField(tag);
				let sub = this.getSubfield(tag, code, tagPlace, codePlace);
				
				if (sub) {
					sub.value = value
				} else if (field) {					
					field.subfields.push(new Subfield(code, value))
				} else {
					this.fields.push(new DataField(tag, [" ", " "], [new Subfield(code, value)]))
				}
			}
			
			// HTTP methods 
			// return promises of this
			
			get() {
				return fetch(this.url).then(
					response => {
						if (response.ok) {
							return response.json()
						}
						
						return Promise.reject(response.json())
					}
				).then(
					json => {
						this.parse(json['data']);
						
						return this
					}
				)
			}
			
			post() {
				if (this.recordId) {
					throw new Error("Can't POST existing record")
				}
				
				return fetch(
					this.collectionUrl + '/records',
					{
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: this.stringify()
					}	
				).then(
					response => {
						if (response.ok) {	
							return response.json()
						}
						
						return Promise.reject(response.json())
					}
				).then(
					json => {
						this.url = json['result'];
						this.recordId = parseInt(this.url.split('/').slice(-1));
						
						return this
					}
				);
			}
		
			put() {
				if (! this.recordId) {
					throw new Error("Can't PUT new record")
				}
				
				return fetch(
					this.url,
					{
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: this.serialize()
					}	
				).then(
					response => {
						if (response.ok) {
							return this
						} 
						
						return Promise.reject(response.json())
					}
				)
			}
			
			delete() {
				if (! this.recordId) {
					throw new Error("Can't DELETE new record")
				}
				
				return fetch(
					this.url,
					{method: 'DELETE'}	
				).then(
					response => {
						if (response.ok) {
							this.recordId = null;
							this.url = null;
						
							return this;
						}
						
						return Promise.reject(response.json())
					}
				)
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
