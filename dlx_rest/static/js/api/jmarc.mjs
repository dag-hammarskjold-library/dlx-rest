"use strict";

import { validationData } from "../utils/validation.js";

// todo: fetch this data from the API to avoid redundancy
const authMap = {
	// this should be coming form the API @ /marc/<bibs|auths>/lookup/map
	"bibs": {
		'100': { 'a': '100' },
		'110': { 'a': '110' },
		'111': { 'a': '111' },
		'130': { 'a': '130' },
		'191': { 'b': '190', 'c': '190' },
		'440': { 'a': '140' },
		'600': { 'a': '100', 'g': '100' },
		'610': { 'a': '110', 'g': '110' },
		'611': { 'a': '111', 'g': '111' },
		'630': { 'a': '130', 'g': '130' },
		'650': { 'a': '150' },
		'651': { 'a': '151' },
		'700': { 'a': '100', 'g': '100' },
		'710': { 'a': '110' },
		'711': { 'a': '111' },
		'730': { 'a': '130' },
		'791': { 'b': '190', 'c': '190' },
		'830': { 'a': '130' },
		'991': { 'a': '191', 'b': '191', 'c': '191', 'd': '191' }
	},
	"auths": {
		//'491': {'a': '191', 'b': '191', 'c': '191', 'd': '191'},
		'370': { 'a': '110' },
		'500': { 'a': '100' },
		'510': { 'a': '110' },
		'511': { 'a': '111' },
		'530': { 'a': '130' },
		'550': { 'a': '150' },
		'551': { 'a': '151' },
		'591': { 'a': '191', 'b': '191', 'c': '191', 'd': '191' }
	}
};

class ValidationFlag {
	constructor(message) {
		this.message = message;
	}
}

class RecordValidationFlag extends ValidationFlag {
	constructor(message) { super(message) }
}

export class SubfieldCodeValidationFlag extends ValidationFlag {
	constructor(message) { super(message) }
}

export class SubfieldValueValidationFlag extends ValidationFlag {
	constructor(message) { super(message) }
}

export class TagValidationFlag extends ValidationFlag {
	constructor(message) { super(message) }
}

export class Indicator1ValidationFlag extends ValidationFlag {
	constructor(message) { super(message) }
}

export class Indicator2ValidationFlag extends ValidationFlag {
	constructor(message) { super(message) }
}

export class Subfield {
	constructor(code, value, xref) {
		this.code = code;
		this.value = value;
		this.xref = xref;
	}

	compile() {
		return { 'code': this.code, 'value': this.value, 'xref': this.xref }
	}

	validationWarnings() {
		let flags = [];
		//let data = validationData[this.parentField.parentRecord.collection][this.parentField.tag];
		let data = validationData[this.parentField.parentRecord.getVirtualCollection()][this.parentField.tag];
		if (!data) return []

		// valid subfields
		if (!data.validSubfields.includes("*") && !data.validSubfields.includes(this.code)) {
			flags.push(
				new SubfieldCodeValidationFlag(
					`${this.parentField.tag}: Invalid subfield code "${this.code}". Valid subfields: ${data.validSubfields.join(", ")}`
				)
			)
		}

		// string match
		if (this.value && "validStrings" in data && this.code in data.validStrings) {
			let validStrings = data.validStrings[this.code];

			if (!validStrings.includes(this.value)) {
				flags.push(
					new SubfieldValueValidationFlag(
						`${this.parentField.tag} \$${this.code}: Invalid string value "${this.value}". Valid values: ${validStrings.join(", ")}`
					)
				)
			}
		}

		// date match
		if (this.value && "isDate" in data && this.code in data.isDate) {
			let dateStr = this.value
				// add dashes for valdation using JS Date object, but don't update the value.
				// dashes are added to dates in the runSaveActions method
				.replace(" ", "-")
				.replace(/^(\d{4})(\d{2})/, "$1-$2")
				.replace(/^(\d{4})-(\d{2})(\d{2})$/, "$1-$2-$3");

			let date = new Date(dateStr);

			if (date.toString() === "Invalid Date" || ![4, 7, 10].includes(dateStr.length)) {
				flags.push(
					new SubfieldValueValidationFlag(`${this.tag} \$${this.code}: Invalid date "${this.value}"`)
				)
			}
		}

		// regex match
		if (this.value && "validRegex" in data && this.code in data.validRegex) {
			let validRegexes = data.validRegex[this.code];
			let matched = false;

			validRegexes.forEach(x => {
				if (this.value.match(new RegExp(x))) {
					matched = true;
				}
			});

			if (!matched) {
				flags.push(
					new SubfieldValueValidationFlag(
						`Invalid regex match "${this.tag} \$${this.code}: ${this.value}". Valid regex: ${validRegexes.join(", ")}`
					)
				)
			}
		}

		return flags
	}

	async detectAndSetXref() {
		/* Tries to look up and set the subfield xref given the subfield value.
		Sets xref to an error object if the xref is not found or ambiguous */

		const field = this.parentField;
		const jmarc = field.parentRecord;
		const isAuthorityControlled = jmarc.isAuthorityControlled(field.tag, this.code);

		if (isAuthorityControlled) {
			const searchStr =
				field.subfields
					.filter(x => Object.keys(authMap[jmarc.collection][field.tag]).includes(x.code))
					.map(x => `${authMap[jmarc.collection][field.tag][x.code]}__${x.code}:'${x.value}'`)
					.join(" AND ");

			return fetch(Jmarc.apiUrl + "marc/auths/records?search=" + encodeURIComponent(searchStr))
				.then(response => response.json())
				.then(json => {
					const recordsList = json['data'];
					let xref;

					if (recordsList.length === 0) {
						xref = new Error("Heading does not exist")
					} else if (recordsList.length > 1) {
						xref = new Error("Ambiguous heading")
					} else {
						// get the xref from the URL
						const parts = recordsList[0].split("/");
						xref = parts[parts.length - 1];
					}

					this.xref = xref;
					return xref
				}).catch(error => { throw error })
		}
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
		if (tag && !tag.match(/^00/)) { throw new Error("invalid Control Field tag") }

		this.tag = tag;
		this.value = value;
	}

	toStr() {
		return self.value
	}

	validate() { }
}

export class DataField {
	constructor(tag, indicators, subfields) {
		if (tag && tag.match(/^00/)) { throw new Error("invalid Data Field tag") }

		this.checked = false;
		this.tag = tag;
		this.indicators = indicators || [" ", " "];
		this.subfields = subfields || [];
	}

	validate() {
		// lower level checks
		// these throw errors
		if (!this.subfields) {
			throw new Error("Subfield required")
		}

		let amap = this instanceof BibDataField ? authMap['bibs'] : authMap['auths'];

		for (let subfield of this.subfields) {
			if (!subfield.code) {
				throw new Error("Subfield code required")
			}

			if (!subfield.value || subfield.value.match(/^\s+$/)) {
				//throw new Error("Subfield value required")
				this.deleteSubfield(subfield);

				if (this.subfields.length === 0) {
					this.parentRecord.deleteField(this);
				}
			} else if (this.tag in amap && subfield.code in amap[this.tag] && !subfield.xref) {
				throw new Error(`Invalid authority-controlled value: ${this.tag} ${subfield.code} ${subfield.value}`)
			}
		}
	}

	validationWarnings() {
		let flags = [];
		// Change collection here to virtualCollection, which is inferred from data already in the record
		//let data = validationData[this.parentRecord.collection][this.tag];
		let data = validationData[this.parentRecord.getVirtualCollection()][this.tag];
		if (!data) return []

		// field level
		// required
		// we already know the field exists

		// repeatable
		if (data.repeatable === false && this.parentRecord.getFields(this.tag).length > 1) {
			if (this !== this.parentRecord.getFields(this.tag)[0]) {
				// this is not the first instance of the tag
				flags.push(new TagValidationFlag(`${this.tag} Field not repeatable`));
			}
		}
		// valid indicators
		for (let i of [1, 2]) {
			let inds = i === 1 ? data.validIndicators1 : data.validIndicators2;

			if (!inds.includes("*") && this.indicators[i - 1] !== "_" && !inds.includes(this.indicators[i - 1])) {
				let flag = i === 1 ? Indicator1ValidationFlag : Indicator2ValidationFlag;

				flags.push(
					new flag(`${this.tag}: Invalid indicator ${i}. Valid indicators: ${inds.join(", ") || "None"}`)
				)
			}
		}

		// required subfields
		let codes = this.subfields.map(x => x.code);

		data.requiredSubfields.forEach(x => {
			if (!codes.includes(x)) {
				flags.push(
					new TagValidationFlag(`${this.tag}: Required subfield "${x}" is missing`)
				)
			} else if (!this.getSubfield(x).value) {
				flags.push(
					new TagValidationFlag(`${this.tag}: Required subfield "${x}" is blank`)
				)
			}
		});

		return flags
	}

	createSubfield(code, place) {
		let subfield = new Subfield(code);

		if (place) {
			this.subfields.splice(place, 0, subfield);
		}
		else {
			this.subfields.push(subfield);
		}

		subfield.parentField = this;

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

	compile() {
		let data = {};

		data['tag'] = this.tag;
		data['indicators'] = this.indicators;
		data['subfields'] = this.subfields.map(x => { return { 'code': x.code, 'value': x.value, 'xref': x.xref } });

		return data
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

	async lookup() {
		let collection = this instanceof BibDataField ? "bibs" : "auths";
		let lookupString = this.subfields.filter(x => x.value).map(x => { return `${encodeURIComponent(x.code)}=${encodeURIComponent(x.value)}` }).join("&");
		let url = Jmarc.apiUrl + `marc/${collection}/lookup/${this.tag}?${lookupString}`;

		// determine the lookup type
		if (["191", "791", "991"].includes(this.tag)) {
			url += '&type=partial'
		} else {
			url += '&type=text'
		}

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
					// Issue #190: Exclude deprecated authority terms from the lookup
					let newJmarc = new Jmarc("auths").parse(auth)
					//console.log(newJmarc)
					let this682 = newJmarc.getField('682')
					if (this682) {
						let this682_a = this682.getSubfield('a') 
						if (this682_a) {
							if(this682_a.value.toLowerCase() == 'deprecated') {
								continue
							}
						}
					}
					//if (newJmarc.getField('682').getSubfield('a').toLowerCase() == 'deprecated') {
					//	continue
					//}
					for (let tag of Object.keys(auth).filter(x => x.match(/^1\d\d/))) {
						let field = this instanceof BibDataField ? new BibDataField(this.tag) : new AuthDataField(this.tag);
						field.indicators = auth[tag][0].indicators;
						//let wantedSubfields = Object.keys(authMap[collection][this.tag]);

						for (let sf of auth[tag][0]['subfields']) { //.filter(x => wantedSubfields.includes(x.code))) {
							field.subfields.push(new Subfield(sf['code'], sf['value'], auth['_id']));
						}

						choices.push(field)
					}
				}

				return choices
			}
		).catch(error => { throw error })
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
		if (!Jmarc.apiUrl) { throw new Error("Jmarc.apiUrl must be set") };
		Jmarc.apiUrl = Jmarc.apiUrl.slice(-1) == '/' ? Jmarc.apiUrl : Jmarc.apiUrl + '/';

		if (!collection) { throw new Error("Collection required (\"bibs\" or \"auths\")") };
		this.collection = collection;
		this.recordClass = collection === "bibs" ? Bib : Auth;
		this.collectionUrl = Jmarc.apiUrl + `marc/${collection}`;
		this.recordId = null;
		this.authMap = this.collection === 'bibs' ? authMap['bibs'] : authMap['auths'];
		this.handleSetInterval = 0
		this.checkUndoRedoEntry = false
		this.fields = [];
		this._history = [];
		this.undoredoIndex = 0;
		this.undoredoVector = [];
	}

	getVirtualCollection() {
		let virtualCollection = this.collection
		if (this.getField("089")) {
			let recordType = this.getField("089").getSubfield("b")
			if (recordType && recordType.value && recordType.value == "B22") {
				virtualCollection = "speeches"
			}
			else if (recordType && recordType.value && recordType.value == "B23") {
				virtualCollection = "votes"
			}
		}
		return virtualCollection
	}

	// check if value already inside the vector
	isInsideVectorAlready(value) {
		let findOccurence = false
		this.undoredoVector.forEach(element => {
			if (JSON.stringify(element.valueEntry) === JSON.stringify(value)) {
				return findOccurence = true
			}
		})
		return findOccurence
	}


	// this method will check every "myTime" if the field property of the record has changed
	startcheckingUndoRedoEntry(myTime) {

		this.handleSetInterval = setInterval(() => {

			// if (Object.keys(this.oldJmarcValue).length === 0) {
			// 	this.oldJmarcValue = JSON.stringify(this.compile())
			// 	this.addUndoredoEntry()
			// } 

			if (this.undoredoVector.length === 0) {
				this.addUndoredoEntry()
			}

			else if (this.isInsideVectorAlready(this.compile()) === false) {
				this.addUndoredoEntry()
				//console.log("change(s) on : " + this.recordId)
				//console.log("id context: " + this.handleSetInterval)
			}

			else if (this.isInsideVectorAlready(this.compile()) === true) {
				//console.log("no change on :" + this.recordId)
				//console.log("id context: " + this.handleSetInterval)
			}

			//console.log(" number of entries : " + this.undoredoVector.length)

		}, myTime);

	}

	stopcheckingUndoRedoEntry() {
		clearInterval(this.handleSetInterval)
	}

	// add a new undoredoEntry
	// this method should be add each time we are changing the value of one input
	addUndoredoEntry() {

		// collecting the values to assign
		let today = new Date();
		let dateEntry = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
		let recordIdEntry = this.recordId
		let timeEntry = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
		let valueEntry = {}
		valueEntry = this.compile()

		// defining the undoredoEntry Object
		let undoredoEntry = {}

		// adding the properties
		undoredoEntry.dateEntry = dateEntry
		undoredoEntry.timeEntry = timeEntry
		undoredoEntry.recordIdEntry = recordIdEntry
		undoredoEntry.valueEntry = valueEntry

		// adding the entry inside the vector
		this.undoredoVector.push(undoredoEntry)

		// reset the index to the last value
		this.undoredoIndex = this.undoredoVector.length - 1

	}

	// clear the undoredo Vector
	clearUndoredoVector() {
		this.undoredoVector = []
	}

	// move undoredoIndex f
	// direction can be
	// undo : right from left
	// redo : left from right

	moveUndoredoIndexUndo() {

		if (this.undoredoVector.length > 0) {
			if (this.undoredoIndex === 0) {
				alert("this is the first entry!!!!")
			}
			if (this.undoredoIndex > 0) {

				if (this.undoredoIndex > 0) {
					this.undoredoIndex = this.undoredoIndex - 1
				}
				//this.fields=[]
				this.parse(this.undoredoVector[this.undoredoIndex].valueEntry)
			}
		}
		if (this.undoredoVector.length === 0) {
			alert("No changes detected!!!!")
		}
	}

	moveUndoredoIndexRedo() {

		if (this.undoredoVector.length > 0) {
			if (this.undoredoIndex == this.undoredoVector.length - 1) {
				alert("this is the last entry!!!!")
			}
			if (this.undoredoIndex < this.undoredoVector.length) {


				if (this.undoredoIndex < this.undoredoVector.length - 1) {
					this.undoredoIndex = this.undoredoIndex + 1
				}
				//this.fields=[]
				this.parse(this.undoredoVector[this.undoredoIndex].valueEntry)
			}
		}
		if (this.undoredoVector.length === 0) {
			alert("No changes detected!!!!")
		}
	}


	isAuthorityControlled(tag, code) {
		let map = authMap;

		if (map[this.collection][tag] && map[this.collection][tag][code]) {
			return true
		}

		return false
	}

	updateSavedState() {
		this.savedState = this.compile();

		this.getDataFields().forEach(x => {
			x.savedState = x.compile();
			x.subfields.forEach(y => { y.savedState = y.compile() });
		});
	}

	static async get(collection, recordId) {
		if (!Jmarc.apiUrl) { throw new Error("Jmarc.apiUrl must be set") };
		Jmarc.apiUrl = Jmarc.apiUrl.slice(-1) == '/' ? Jmarc.apiUrl : Jmarc.apiUrl + '/';

		if (!collection) { throw new Error("Collection required") }
		let jmarc = new Jmarc(collection);

		if (!recordId) { throw new Error("Record ID required") }
		jmarc.recordId = parseInt(recordId);
		jmarc.url = Jmarc.apiUrl + `marc/${collection}/records/${recordId}`;

		let savedResponse;

		return fetch(jmarc.url).then(
			response => {
				savedResponse = response;

				return response.json()
			}
		).then(
			json => {
				if (savedResponse.status === 404) {
					// record not found
					return
				} else if (savedResponse.status != 200) {
					throw new Error(json['message'])
				}

				jmarc.parse(json['data']);
				jmarc.updateSavedState();

				jmarc.files = json['data']['files']

				return jmarc
			}
		).catch(
			error => { throw error }
		)
	}

	static async listWorkforms(collection) {
		let response = await fetch(Jmarc.apiUrl + `marc/${collection}/workforms`);
		let json = await response.json().catch(error => { throw error })

		return json.data.map(
			url => url.split("/").slice(-1)[0]
		);
	}

	static async workforms(collection) {
		let workforms = []

		for (let name of await Jmarc.listWorkforms(collection)) {
			workforms.push(await Jmarc.fromWorkform(collection, name))
		}

		return workforms
	}

	static async fromWorkform(collection, workformName) {
		let jmarc = new Workform(collection);

		return fetch(jmarc.collectionUrl + '/workforms/' + workformName).then(
			response => {
				if (response.ok) {
					return response.json();
				} else {
					throw new Error(`Workform "${workformName}" not found`);
				}
			}
		).then(
			json => {
				jmarc.parse(json.data);
				jmarc.workformName = workformName;
				jmarc.workformDescription = json.data.description;

				return jmarc;
			}
		).catch(error => { throw error })
	}

	static async deleteWorkform(collection, workformName) {
		return fetch(
			Jmarc.apiUrl + `marc/${collection}/workforms/${workformName}`,
			{ method: 'DELETE' }
		).then(
			response => response.json()
		).then(
			json => {
				return true
			}
		).catch(error => { throw error })
	}

	async saveWorkform(workformName, description) {
		let data = this.compile();
		data.name = workformName;
		data.description = description;
		delete data["_id"];

		await fetch(
			`${this.collectionUrl}/workforms/${encodeURIComponent(workformName)}`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			}
		).then(response => {
			if (response.ok) {
				return true;
			}
		}).catch(json => {
			throw new Error(json['message']);
		});
	}

	async saveAsWorkform(workformName, description) {
		let data = this.compile()
		data['name'] = workformName;
		data['description'] = description;
		delete data['_id'];

		let error = false;

		const response = await fetch(
			this.collectionUrl + '/workforms',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			}
		);
		if (!response.ok) {
			error = true;
		}
		const json = await response.json();
		if (error === true) {
			throw new Error(json['message']);
		}
		return true;
	}

	async post() {
		if (this.recordId) {
			return Promise.reject("Can't POST existing record")
		}

		try {
			this.validate();
		} catch (error) {
			return Promise.reject(error)
		}

		this.runSaveActions();

		let savedResponse;

		return fetch(
			this.collectionUrl + '/records',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
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
				this.updateSavedState();

				return Jmarc.get(this.collection, this.recordId)
			}
		).catch(
			error => { throw error }
		)
	}

	async put() {
		if (!this.recordId) {
			return Promise.reject("Can't PUT new record")
		}

		try {
			this.validate();
		} catch (error) {
			return Promise.reject(error)
		}

		this.runSaveActions();

		let savedResponse;

		return fetch(
			this.url,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
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

				this.updateSavedState();

				return Jmarc.get(this.collection, this.recordId)
			}
		).catch(
			error => { throw error }
		)
	}

	async delete() {
		if (!this.recordId) {
			throw new Error("Can't DELETE new record")
		}

		let savedResponse;

		return fetch(
			this.url,
			{ method: 'DELETE' }
		).then(
			response => {
				if (response.status == 204) {
					this.recordId = null;
					this.url = null;

					return this;
				} else if (response.status == 403) {
					throw new Error("Auth record in use")
				}

				return response.json()
			}
		)
			.then(
				check => {
					if (check instanceof Jmarc) {
						return check
					}

					throw new Error(`Something went wrong: ${check}`)
				}
			).catch(
				error => { throw error }
			)
	}

	get saved() {
		return JSON.stringify(this.savedState) === JSON.stringify(this.compile());
	}

	parse(data = {}) {
		this.created = data['created'];
		this.createdUser = data['created_user'];
		this.updated = data['updated'];
		this.user = data['user'];
		//this.fields = [];

		let tags = Object.keys(data).filter(x => x.match(/^\d{3}/));
		tags = tags.sort((a, b) => parseInt(a) - parseInt(b));

		// update the existing objects if the new data exists in this record in order to preserve saved state
		for (let tag of tags) {
			for (let [i, field] of data[tag].entries()) {
				let newField = this.getField(tag, i) || this.createField(tag);
				newField._seen = true;

				if (tag.match(/^00/)) {
					newField.value = field;
				} else {
					newField.indicators = field.indicators.map(x => x.replace(" ", "_"));
					let seen = {}; // for keeping the subfield order

					for (let subfield of field.subfields) {
						let newSub = newField.getSubfield(subfield.code, seen[subfield.code]) || newField.createSubfield(subfield.code);
						newSub._seen = true; // temp flag used for differentiating previous state
						newSub.value = subfield.value;
						if (tag in authMap[this.collection] && subfield.code in authMap[this.collection][tag]) {
							newSub.xref = subfield.xref
						}
						if (!seen[subfield.code]) seen[subfield.code] = 0;
						seen[subfield.code]++;
					}
				}
			}
		}

		// remove existing data not in new data
		for (let field of this.getDataFields()) {
			if (!field._seen) {
				this.deleteField(field);
				continue
			}

			delete field._seen;

			for (let subfield of field.subfields) {
				if (!subfield._seen) {
					field.deleteSubfield(subfield);
				}

				delete subfield._seen;
			}
		}

		return this
	}

	compile() {
		let recordData = {
			_id: this.recordId,
			created: this.created,
			created_user: this.createdUser,
			updated: this.updated,
			user: this.user
		};
		let tags = Array.from(new Set(this.fields.map(x => x.tag)));

		for (let tag of tags.sort(x => parseInt(x))) {
			recordData[tag] = recordData[tag] || [];

			for (let field of this.getFields(tag)) {
				if (field.constructor.name == 'ControlField') {
					recordData[tag].push(field.value);
				} else {
					recordData[tag].push(field.compile());
				}
			}
		}

		return recordData
	}

	stringify() {
		return JSON.stringify(this.compile())
	}

	toStr() {
		return this.fields.filter(x => !x.tag.match(/^00/)).map(x => `: ${x.tag} ${x.toStr()}`).join("\n")
	}

	async history() {
		if (typeof this.url === "undefined") {
			return []
		}

		let response = await fetch(this.url + "/history");
		let json = await response.json();
		if (response.status != 200) throw new Error(json['message']);
		let data = json['data'];
		let promises = data.map(async result => {
			let jmarc = new Jmarc(this.collection);
			let response = await fetch(result.event);
			let json = await response.json();
			if (response.status != 200) { throw new Error(json['message']) }
			return jmarc.parse(json['data']);
		});

		// list of jmarc objects
		return Promise.all(promises)
	}

	diff(other) {
		// returns a new Jmarc record where the fields different from "other" are tagged
		if (!other instanceof Jmarc) { throw new Error("First argument must be instance of Jmarc") };

		let diff = new Diff(this.collection);
		diff.parse(this.compile());

		for (let field of diff.fields) {
			if (other.fields.map(x => x.toStr()).includes(field.toStr())) {
				field.isDiff = false
			} else {
				field.isDiff = true
			}
		}

		return diff
	}

	clone() {
		return (new this.recordClass).parse(this.compile());
	}

	createField(tag, place) {
		let field;

		if (tag && tag.match(/^00/)) {
			field = new ControlField(tag)
		} else {
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
			let found = false;

			for (let [c, f] of Object.entries(this.fields)) {
				if (f.tag === field.tag) {
					if (i === place) {
						this.fields.splice(c, 0, field);
						found = true;
					}

					i++;
				}
			}

			if (!found) {
				// put at end of tag group
				this.fields.splice(
					this.fields.indexOf(this.getField(field.tag)) + this.getFields(field.tag).length,
					0,
					field
				);
			}
		} else if (place) {
			// record place
			this.fields.splice(place, 0, field);
		} else {
			this.fields.push(field);
		}

		field.parentRecord = this;

		return field
	}

	getControlFields() {
		return this.fields.filter(x => x.tag.match(/^0{2}/))
	}

	getDataFields() {
		return this.fields.filter(x => !x.tag.match(/^0{2}/))
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

	validate() {
		// lower level checks
		for (let field of this.fields) {
			if (!field.tag) {
				throw new Error("Tag required")
			}

			if (!field.tag.match(/\d{3}/)) {
				throw new Error("Invalid tag")
			}

			field.validate()

			if (this.collection == "auths") {
				if (!this.fields.map(x => x.tag.substring(0, 1)).includes("1")) {
					throw new Error("Heading field required")
				}
			}
		}
	}

	validationWarnings() {
		// record level validations
		let flags = [];
		//let data = validationData[this.collection];
		let data = validationData[this.getVirtualCollection()]

		// check for required fields
		let required = Object.keys(data).filter(x => data[x].required);
		let tags = new Set(this.getDataFields().map(x => x.tag));

		required.forEach(x => {
			if (Array.from(tags).indexOf(x) === -1) {
				flags.push(new RecordValidationFlag(`Required field ${x} is missing`));
			}
		});

		return flags
	}

	allValidationWarnings() {
		// returns validation flags at all levels: record, field, subfield
		let flags = this.validationWarnings();

		this.getDataFields().forEach(field => {
			flags.push(field.validationWarnings().flat());

			field.subfields.forEach(subfield => {
				flags.push(subfield.validationWarnings().flat())
			})
		});

		return flags.flat()
	}

	async symbolInUse() {
		// Determine if a symbol is already being used.
		if (this.collection !== "bibs") return

		let inUse = false;

		for (const tag of ['191', '791']) {
			// only look in same symbol fields in other records
			for (const field of this.getFields(tag)) {
				if (!field.getSubfield("a")) continue // field may not have subfield $a
				const searchStr = `${tag}__a:'${field.getSubfield("a").value}'`;
				const url = Jmarc.apiUrl + "/marc/bibs/records?search=" + encodeURIComponent(searchStr) + '&limit=1';
				const res = await fetch(url);
				const json = await res.json();
				if (res.status != 200) { throw new Error(json['message']) }
				const results = json['data'];

				if (results.length > 0) inUse = true
			}
		}

		return inUse
	}

	async authExists() {
		/*
		Similar to authHeadingInUse, but doesn't care about returning ambiguous results.

		We want this to evaluate to true, but don't need regex since we already have 
		other ways to force exact matching.
		*/
		if (this.collection !== "auths") return
		let headingField = (this.fields.filter(x => x.tag.match(/^1/)) || [null])[0];

		if (!headingField) return

		let searchStr =
			headingField.subfields
				.map(x => `${headingField.tag}__${x.code}:'${x.value}'`)
				.join(" AND ")

		let url = Jmarc.apiUrl + "/marc/auths/records/count?search=" + encodeURIComponent(searchStr)
		let response = await fetch(url).catch(e => { throw e });
		let json = await response.json()

		if (response.status !== 200) {
			throw new Error(json['message'])
		}

		let count = json['data']

		if (count === 1) {
			return true
		} else {
			return false
		}
	}

	async authHeadingInUse() {
		if (this.collection !== "auths") return

		let headingField = (this.fields.filter(x => x.tag.match(/^1/)) || [null])[0];

		if (!headingField) return

		let searchStr =
			headingField.subfields
				.map(x => `${headingField.tag}__${x.code}:'${x.value}'`)
				.join(" AND ");

		const url = Jmarc.apiUrl + "/marc/auths/records/count?search=" + encodeURIComponent(searchStr);
		const response = await fetch(url).catch(e => { throw e });
		const json = await response.json();

		if (response.status !== 200) {
			throw new Error(json['message'])
		}

		let count = json['data'];

		if (count === 0) {
			return false
		} else if (count > 1000) {
			// this shouldn't really happen IRL as there won't be this many similar auth records.
			// if there are too many records to look up here, we will need a more efficient check
			return Promise.reject(new Error("There are too many records to fetch here. Please notify the developers."))
		} else {
			// other auths that have the same subfield value(s) in the heading, but
			// could have additional subfields that make it unique
			let url = Jmarc.apiUrl + "/marc/auths/records?search=" + encodeURIComponent(searchStr) + '&limit=' + encodeURIComponent(count);

			let matches = await fetch(url)
				.then(response => {
					return response.json()
				}).then(json => {
					// get the record IDs from the search results
					return json['data'].map(url => url.split('/').slice(-1)[0]);
				}).catch(error => { throw error })

			// get the records
			let promises = matches.map(recordId => Jmarc.get("auths", recordId));
			let records = await Promise.all(promises);

			for (let auth of records) {
				if (auth.recordId === this.recordId) continue

				let otherHeadingField = auth.fields.filter(x => x.tag.match(/^1/))[0];

				if (headingField.toStr() === otherHeadingField.toStr()) {
					// another record has the same exact heading field value
					return true
				}
			}

			return false
		}
	}

	runSaveActions() {
		let addedFields = [];
		// parse rules
		Object.keys(validationData[this.collection]).forEach(tag => {
			const data = validationData[this.collection][tag]

			// add dashes to dates
			if ("isDate" in data) {
				for (const field of this.getFields(tag)) {
					for (const code of Object.keys(data.isDate)) {
						for (const subfield of field.getSubfields(code)) {
							subfield.value = subfield.value
								.replace(" ", "-")
								.replace(/^(\d{4})(\d{2})/, "$1-$2")
								.replace(/^(\d{4})-(\d{2})(\d{2})$/, "$1-$2-$3");
						}
					}
				}
			}

			if ("saveActions" in data) {
				this.deleteField(tag);

				for (let [criteria, map] of Object.entries(data["saveActions"])) {
					let terms = criteria.split(/\s*(AND|OR|NOT)\s+/).filter(x => x);
					let modifier = "";
					let last_bool = true;

					for (let [i, term] of Object.entries(terms)) {
						if (["AND", "OR", "NOT"].includes(term)) {
							modifier += term
						} else {
							let parts = term.split(":");
							let field = parts[0];
							let value = parts[1];
							let field_parts = field.split("__");
							let tag = field_parts[0].match(/\d\d\d/) ? field_parts[0] : null;
							let sub;
							if (field_parts.length > 1) { sub = field_parts[1] };

							function evaluate(jmarc, tag, sub, val) {
								for (let field of jmarc.getFields(tag)) {
									let subfields = sub ? field.getSubfields(sub) : field.subfields;
									let regex;

									if (val.substring(0, 1) === "/") {
										regex = val.substring(1, val.length - 1);
									} else {
										regex = val
											.replaceAll("/", "\\/")
											.replaceAll("[", "\\[")
											.replaceAll("]", "\\]")
											.replaceAll(".", "\\.")
											.replaceAll("*", ".*");
									}

									let rx = new RegExp(regex, 'i'); // case insensitive

									for (let subfield of subfields) {
										if (subfield.value.match(rx)) {
											return true
										}
									}
								}

								return false
							}

							switch (modifier) {
								case "":
									last_bool = evaluate(this, tag, sub, value);
									break
								case "NOT":
									last_bool = !evaluate(this, tag, sub, value);
									break
								case "AND":
									last_bool = last_bool && evaluate(this, tag, sub, value);
									break
								case "ANDNOT":
									last_bool = last_bool && !evaluate(this, tag, sub, value);
									break
								case "OR":
									// pass if true or last_bool is true
									last_bool = last_bool || evaluate(this, tag, sub, value)
									break
								case "ORNOT":
									// pass if false or last_bool is true
									last_bool = last_bool || !evaluate(this, tag, sub, value)
									break
							}

							modifier = "";
						}
					}

					if (last_bool === true) {
						let newField = this.createField(tag);
						newField.indicators = ["_", "_"];

						for (let [code, string] of Object.entries(map).sort()) {
							if (!string) continue

							newField.createSubfield(code).value = string;
						}

						addedFields.push(newField)
					}
				}
			}
		});
	}
}

export class Bib extends Jmarc {
	constructor() {
		super("bibs");
	}

	static get(recordId) {
		return Jmarc.get("bibs", recordId)
	}

	clone() {
		return super.clone();
	}

	validate() {
		super.validate();
	}
}

export class Auth extends Jmarc {
	constructor() {
		super("auths");
	}

	static get(recordId) {
		return Jmarc.get("auths", recordId)
	}

	clone() {
		return super.clone()
	}

	validate() {
		super.validate();
	}
}

export class Workform extends Jmarc {
	// work in progress

	constructor(collection, name = null) {
		super(collection);
	}
}

export class Diff extends Jmarc {
	// work in progress

	constructor(collection) {
		super(collection);
	}
}
