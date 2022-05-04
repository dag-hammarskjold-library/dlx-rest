/* This is a Jasmine test suite https://jasmine.github.io/

To install the Node dependencies run `npm install node-fetch rollup jasmine`

To run the spec run `jasmine <path to this file>` 

The Flask app must be currently running in TESTING mode. Export/setx 
DLX_REST_TESTING to a true value before starting the app. If the app is not in
TESTING mode, the spec will fail at the app login prompt */

"use strict";

import {Jmarc, Bib, Auth, DataField, Subfield} from "../static/js/jmarc.mjs";
import fetch from "node-fetch";

if (! globalThis.fetch) {
	globalThis.fetch = fetch;
}

Jmarc.apiUrl = "http://localhost:5000/api/";

describe(
    "jmarcjs", 
    function() {
        it(
            "create, read, and write bib and auth records", 
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
            "determine whether fields are authority-controlled",
            function() {
                var bib = new Bib();
                expect(bib.isAuthorityControlled("700", "a")).toBeTrue();
            }
        );
        
        it(
            "lookup of authority-controlled values",
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
        
        it(
            "record history",
            async function() {
                // record created
                var jmarc = new Bib();
                var history = await jmarc.history();
                expect(history).toEqual([]);
                
                // record saved
                jmarc.createField("245").createSubfield("a").value = "New record";
                await jmarc.post();
                history = await jmarc.history();
                expect(history[0]).toBeInstanceOf(Jmarc);
                expect(history[0].getField("245").getSubfield("a").value).toEqual("New record");
                expect(history[0].updated).toBeDefined(); // ISO date string
                expect(history[0].user).toEqual("testing");

                // record updated
                jmarc.getField("245").getSubfield("a").value = "Updated";
                await jmarc.put();
                // history is updated 
                history = await jmarc.history();
                expect(history[1].getField("245").getSubfield("a").value).toEqual("Updated");

                // revert
                jmarc.parse(history[0].compile()) // parse the version data into the jmarc
                await jmarc.put();
                expect(jmarc.getField("245").getSubfield("a").value).toEqual("New record");
            }
        );
        
        it(
            "clone",
            function() {
                var bib = new Bib();
                var field = bib.createField("245").createSubfield("a").value = "A record that will be cloned";
                var cloned = bib.clone();
                expect(cloned).toBeInstanceOf(Bib);
                expect(cloned.getField("245").getSubfield("a").value).toEqual("A record that will be cloned");
            }
        );
        
        it(
            "delete fields",
            function() {
                // all fields of tag
                var auth = new Auth();
                auth.createField("001").value = "Fake ID";
                auth.createField("245").createSubfield("a").value = "Other field";
                expect(auth.getField("001").value).toEqual("Fake ID");
                auth.deleteField("001");
                expect(auth.getField("001")).toBeUndefined();
                expect(auth.getField("245").getSubfield("a").value).toEqual("Other field");
                
                // single field by place
                auth.createField("900").createSubfield("a").value = "Field 1";
                auth.createField("900").createSubfield("a").value = "Field 2";
                auth.deleteField("900", 1);
                expect(auth.getField("900", 1)).toBeUndefined();
                expect(auth.getField("900", 0).getSubfield("a").value).toEqual("Field 1");
                
                // single field by instance
                var field = auth.createField("999");
                field.createSubfield("a").value = "Val";
                auth.deleteField(field);
                expect(auth.getField("999")).toBeUndefined();
            }
        )
        
        it(
            "delete subfields",
            function() {
                // all subfields of code
                var bib = new Bib();
                var field = bib.createField("900");
                field.createSubfield("a").value = "Val 1";
                field.createSubfield("a").value = "val 2";
                field.deleteSubfield("a");
                expect(field.getSubfield("a")).toBeUndefined();
                
                // single subfield by code and place
                field.createSubfield("b").value = "Val 1";
                field.createSubfield("b").value = "Val 2";
                field.deleteSubfield("b", 1);
                expect(field.getSubfield("b", 1)).toBeUndefined();
                expect(field.getSubfield("b", 0).value).toEqual("Val 1");
                
                // single subfield by instance
                var subfield = field.createSubfield("c");
                subfield.value = "Val";
                field.deleteSubfield(subfield); // use the subfield object to delete
                expect(field.getSubfield("c")).toBeUndefined();
            }
        )
        
        it(
            "workforms",
            async function() {
                var workforms = await Jmarc.listWorkforms("bibs");
                expect(workforms).toBeInstanceOf(Array);
                
                if (workforms) {
                    for (let name of workforms) {
                        // delete any workforms that may be there from other tests
                        expect(await Jmarc.deleteWorkform("bibs", name)).toBeTrue;
                    }
                }
                
                var jmarc = new Bib();
                jmarc.createField("245").createSubfield("a").value = "Test value";
                expect(await jmarc.saveAsWorkform("Test_workform", "The description")).toBeTrue;

                var names = await Jmarc.listWorkforms("bibs");
                expect(names).toEqual(["Test_workform"]);
                
                var workforms = await Jmarc.workforms("bibs");
                expect(workforms[0]).toBeInstanceOf(Jmarc);
                
                jmarc = await Jmarc.fromWorkform("bibs", "Test_workform");
                expect(jmarc.workformDescription).toEqual("The description")
                expect(jmarc.getField("245").getSubfield("a").value).toEqual("Test value")
                
                expect(await Jmarc.deleteWorkform("bibs", "Test_workform")).toBeTrue;
            }
        )
    }
);
