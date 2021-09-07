/* This is a Jasmine test suite https://jasmine.github.io/

To install the Node dependencies run `npm install node-fetch rollup jasmine`

To run the spec run `jasmine <path to this file>` 

The Flask app must be currently running in TESTING mode. Export/setx 
DLX_REST_TESTING to a true value before starting the app. If the app is not in
TESTING mode, the spec will fail at the app login prompt */

"use strict";

describe(
    "jmarcjs", 
    function() {
        var apiUrl = "http://localhost:5000/api/";
        var jmarcCompiled = __dirname + "/jmarc.umd.js"
        
        beforeEach(
            async function() {
                // convert the jmarc.js module to "UMD" for use in Node
                var rollup = require("rollup");
                
                const bundle = await rollup.rollup({input: __dirname + "/../static/js/jmarc.js"});  
                await bundle.write({format: "umd", file: jmarcCompiled, name: "jmarcjs"});
                await bundle.close();    
            }
        );
        
        afterAll(
            function() {
                // delete the UMD file
                const fs = require('fs');
                
                fs.unlinkSync(jmarcCompiled);
            }
        );
        
        it(
            "create, read, and write bib and auth records", 
            function() {
                const jmarcjs = require(jmarcCompiled);
                jmarcjs.Jmarc.apiUrl = apiUrl;
                
                // create record
                let auth = new jmarcjs.Auth();
                
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
                expect(field).toBeInstanceOf(jmarcjs.DataField);
    
                var subfield = field.getSubfield("a");
                expect(subfield.constructor.name).toEqual("Subfield");
                expect(subfield.code).toEqual("a");
                expect(subfield.value).toEqual("foo");
                
                var field = auth.getField("900", 3); // gets the 4th instance of field 900
                expect(field).toBeInstanceOf(jmarcjs.DataField);
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
                const jmarcjs = require(jmarcCompiled);
                jmarcjs.Jmarc.apiUrl = apiUrl;
                
                var auth = new jmarcjs.Auth();
                auth.createField("100").createSubfield("a").value = "New record";
                expect(auth.saved).toBe(false);
                
                // post
                await auth.post();
                expect(auth.recordId).toBeGreaterThan(0); // backend creates the ID                
                expect(auth.saved).toBe(true);
                
                // get the same record by ID
                var auth = await jmarcjs.Auth.get(auth.recordId);
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
                    await jmarcjs.Jmarc.get("auths", oldId);
                } catch(err) {
                    expect(err.message).toMatch(/^Requested resource not found/)
                }
                  }
        );
        
        it(
            "determine whether fields are authority-controlled",
            function() {
                const jmarcjs = require(jmarcCompiled);
                jmarcjs.Jmarc.apiUrl = apiUrl;
                
                var bib = new jmarcjs.Bib();
                expect(bib.isAuthorityControlled("700", "a")).toBeTrue();
            }
        );
        
        it(
            "lookup of authority-controlled values",
            async function() {
                const jmarcjs = require(jmarcCompiled);
                jmarcjs.Jmarc.apiUrl = apiUrl;
                
                // create test auth record
                var auth = new jmarcjs.Auth();
                var myVal = Math.random().toString();
                auth.createField("100").createSubfield("a").value = myVal;
                await auth.post();
                
                // create test bib record
                var bib = new jmarcjs.Bib();
                var field = bib.createField("700");
                field.createSubfield("a").value = myVal;
                
                var choices = await field.lookup();
                expect(choices[0]).toBeInstanceOf(jmarcjs.DataField);
                expect(choices[0].getSubfield("a").value).toEqual(myVal);
            }
        );
        
        it(
            "record history",
            async function() {
                const jmarcjs = require(jmarcCompiled);
                jmarcjs.Jmarc.apiUrl = apiUrl;
                
                var bib = new jmarcjs.Bib();
                var hist = await bib.history();
                expect(hist).toEqual([]);
                
                bib.createField("245").createSubfield("a").value = "New record";
                await bib.post();
                hist = await bib.history();
                expect(hist[0]).toBeInstanceOf(jmarcjs.Jmarc);
                expect(hist[0].getField("245").getSubfield("a").value).toEqual("New record");
                expect(hist[0].updated).toBeDefined();
                expect(hist[0].user).toBeUndefined(); // there is no user in test environment
            }
        );
        
        it(
            "clone",
            function() {
                const jmarcjs = require(jmarcCompiled);
                jmarcjs.Jmarc.apiUrl = apiUrl;
                
                var bib = new jmarcjs.Bib();
                var field = bib.createField("245").createSubfield("a").value = "A record that will be cloned";
                var cloned = bib.clone();
                expect(cloned).toBeInstanceOf(jmarcjs.Bib);
                expect(cloned.getField("245").getSubfield("a").value).toEqual("A record that will be cloned");
            }
        );
        
        it(
            "delete fields",
            function() {
                const jmarcjs = require(jmarcCompiled);
                jmarcjs.Jmarc.apiUrl = apiUrl;
                
                // all fields of tag
                var auth = new jmarcjs.Auth();
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
                const jmarcjs = require(jmarcCompiled);
                jmarcjs.Jmarc.apiUrl = apiUrl;
                
                // all subfields of code
                var bib = new jmarcjs.Bib();
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
    }
);
