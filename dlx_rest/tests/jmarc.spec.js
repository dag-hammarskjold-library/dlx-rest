"use strict";

const jmarcjs = require('../static/js/jmarc.js');
const Jmarc = jmarcjs.Jmarc;
const Bib = jmarcjs.Bib;
const Auth = jmarcjs.Auth;
const ControlField = jmarcjs.ControlField;
const DataField = jmarcjs.DataField;
const Subfield = jmarcjs.Subfield;

Jmarc.apiUrl = "http://localhost:5000/api";

describe(
	"Jmarc", 
	function() {
		it(
			"create, write, read", 
			function() {
				// create record
				let auth = new Jmarc("auths"); // same as `new Auth()`
				
				// low level write
				var field = new ControlField("007");
				field.value = "foobar";
				auth.fields.push(field);
				
				var field = new DataField("100");
				var subfield = new Subfield("a");
				subfield.value = "foo";
				field.subfields.push(subfield);
				auth.fields.push(field);
				
				// write with shortcuts
				for (let i = 0; i < 5; i++) {
					// repeated fields
					var field = auth.createField("900"); // creates field, adds to record, returns the field
					var subfield = field.createSubfield("a"); // creates subfield, adds to field, returns the subfield
					subfield.value = `bar ${i}`;
					
					// repeated subfield
					var repeatedSubfield = field.createSubfield("a");
					repeatedSubfield.value = `baz ${i}`;
					
					// repeated controlfield
					var field = auth.createField("009"); // knows the field should be a Controfield based on tag
					expect(field.constructor.name).toEqual("ControlField");
					field.value = "foobarbaz";
					
					// chain create methods
					var subfield = auth.createField("200").createSubfield("a");
					expect(subfield.constructor.name).toEqual("Subfield");
					subfield.value = "foobaz";
				}
				
				// iterate
				for (let field of auth.fields) {
					expect(field.tag).toBeDefined();
					
					if (field.constructor.name == "ControlField") { // same as `field.tag.match(/^00/`)
						expect(field.value).toBeDefined();
					}
					
					if (field.constructor.name == "DataField") { // same as `! field.tag.match(/^00/`)
						for (let subfield of field.subfields) {
							expect(subfield.constructor.name).toEqual("Subfield");
							expect(subfield.code).toBeDefined();
							expect(subfield.value).toBeDefined();
						}
					}
				}

				// get 
				var field = auth.getField("007");
				expect(field.value).toEqual("foobar");
				
				var field = auth.getField("100");
				expect(field.constructor.name).toEqual("DataField");
				
				var subfield = field.getSubfield("a");
				expect(subfield.constructor.name).toEqual("Subfield");
				expect(subfield.code).toEqual("a");
				expect(subfield.value).toEqual("foo");
				
				var field = auth.getField("900", 3); // gets the 4th instance of field 900
				expect(field.constructor.name).toEqual("DataField");
				expect(field.getSubfield("a").value).toEqual("bar 3")
				expect(field.getSubfield("a", 1).value).toEqual("baz 3"); // gets the second instance of subfield a
				
				var fields = auth.getFields("900"); // gets all instances of field
				
				var subfield = auth.getField("900", 4).getSubfield("a", 1); // chain get methods
				expect(subfield.value).toEqual("baz 4");
			}
		);
		
		it(
			"post, get, put, delete",
			async function() {
				var auth = new Auth();
				auth.createField("100").createSubfield("a").value = "New record";
				expect(auth.saved).toBe(false);
				
				// post
				await auth.post();
				expect(auth.recordId).toBeGreaterThan(0); // backend creates the ID
				expect(auth.saved).toBe(true);
				
				// get the same record by ID
				var auth = await Jmarc.get("auths", auth.recordId);
				expect(auth.getField("100").getSubfield("a").value).toEqual("New record");
				
				// put
				auth.getField("100").getSubfield("a").value = "Updated record";
				expect(auth.saved).toBe(false);
				await auth.put();
				expect(auth.saved).toBe(true);

				// delete
				var oldId = auth.recordId;
				await auth.delete();
				expect(auth.recordId).toBeNull();

				try {
					await Jmarc.get("auths", oldId);
				} catch(err) {
					expect(err.message).toMatch(/^Requested resource not found/)
				}
  	  	  	}
		);
	}
);
