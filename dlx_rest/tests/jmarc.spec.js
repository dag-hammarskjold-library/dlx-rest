/* The Flask app must be currently running in TESTING mode to use this spec. If
the app is not in TESTING mode, the spec will fail at the app login prompt. 
Unset environment variable DLX_REST_DEV and export/setx DLX_REST_TESTING to a
true value before starting the app */

"use strict";

const jmarcjs = require('../static/js/jmarc.js');
const Jmarc = jmarcjs.Jmarc;
const Bib = jmarcjs.Bib;
const Auth = jmarcjs.Auth;
const ControlField = jmarcjs.ControlField;
const DataField = jmarcjs.DataField;
const Subfield = jmarcjs.Subfield;

Jmarc.apiUrl = "http://localhost:5000/api/";

describe(
	"Jmarc", 
	function() {
		it(
			"does create, write, and read", 
			function() {
				// create record
				let auth = new Auth();
				
				// write
				var field = auth.createField("007");
				field.value = "foobar";
				
				var field = auth.createField("100")
				var subfield = field.createSubfield("a");
				subfield.value = "foo";
				
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
				expect(field).toBeInstanceOf(DataField);
	
				var subfield = field.getSubfield("a");
				expect(subfield.constructor.name).toEqual("Subfield");
				expect(subfield.code).toEqual("a");
				expect(subfield.value).toEqual("foo");
				
				var field = auth.getField("900", 3); // gets the 4th instance of field 900
				expect(field).toBeInstanceOf(DataField);
				expect(field.getSubfield("a").value).toEqual("bar 3")
				expect(field.getSubfield("a", 1).value).toEqual("baz 3"); // gets the second instance of subfield a
				
				var fields = auth.getFields("900"); // gets all instances of field
				
				var subfield = auth.getField("900", 4).getSubfield("a", 1); // chain get methods
				expect(subfield.value).toEqual("baz 4");
			}
		);
		
		it(
			"does post, get, put, delete",
			async function() {
				var auth = new Auth();
				auth.createField("100").createSubfield("a").value = "New record";
				expect(auth.saved).toBe(false);
				
				// post
				await auth.post();
				expect(auth.recordId).toBeGreaterThan(0); // backend creates the ID				
				expect(auth.saved).toBe(true);
				
				// get the same record by ID
				var auth = await Auth.get(auth.recordId);
				expect(auth.getField("100").getSubfield("a").value).toEqual("New record");
				expect(auth.saved).toBe(true);

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
		
		it(
			"knows what fields are authority-controlled",
			function() {
				var bib = new Bib();

				expect(bib.isAuthorityControlled("700", "a")).toBeTrue();
			}
		);
		
		it(
			"does lookup of authority-controlled values",
			async function() {
				// create test auth record
				var auth = new Auth();
				var myVal = Math.random().toString();
				auth.createField("100").createSubfield("a").value = myVal;
				await auth.post();
				
				// create test bib record
				var bib = new Bib();
				var field = bib.createField("700");
				field.createSubfield("a").value = myVal;
				
				var choices = await field.lookup();
				expect(choices[0]).toBeInstanceOf(DataField);
				expect(choices[0].getSubfield("a").value).toEqual(myVal);
			}
		);
	}
);
