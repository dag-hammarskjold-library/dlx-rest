/* This is a Jasmine test suite https://jasmine.github.io/

To install the Node dependencies run `npm install node-fetch rollup jasmine`

To run the spec run `jasmine <path to this file>` 

The Flask app must be currently running in TESTING mode. Export/setx 
DLX_REST_TESTING to a true value before starting the app. If the app is not in
TESTING mode, the spec will fail at the app login prompt */

"use strict";

import { Jmarc, Bib, Auth, ValidationWarning } from "../static/js/api/jmarc.mjs";
import { BibRecord, AuthRecord } from "../static/js/api/models/index.mjs";
import { DataField, Subfield } from "../static/js/api/models/index.mjs";
import { RecordRepository } from "../static/js/api/repositories/index.mjs";
import fetch from "node-fetch";
import { MockServer } from "./mockServer.mjs";

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

describe(
    "jmarcjs",
    function() {
        let mockServer;

        beforeAll(async function() {
            // Create mock server FIRST before initializing Jmarc
            mockServer = new MockServer();
            
            // Now initialize Jmarc which will call AuthMapService.load()
            await Jmarc.init("http://localhost:5000/api/");
        });

        beforeEach(function() {
            // Restore and recreate mock server before each test
            if (mockServer) {
                mockServer.restore();
            }
            mockServer = new MockServer();
        });

        afterEach(function() {
            if (mockServer) {
                mockServer.restore();
            }
        });

        it(
            "initialize services",
            async function() {
                expect(Jmarc.apiUrl).toBeDefined();
                expect(Jmarc.authMapService).toBeDefined();
                expect(Jmarc.validationService).toBeDefined();
                expect(Jmarc.repository).toBeDefined();
                
                // Check that record classes are initialized
                expect(BibRecord.apiUrl).toBeDefined();
                expect(AuthRecord.apiUrl).toBeDefined();
                expect(BibRecord.authMapService).toBeDefined();
                expect(AuthRecord.validationService).toBeDefined();
                
                // Check that auth map was loaded
                expect(Jmarc.authMapService.authMap).toBeDefined();
                expect(Jmarc.authMapService.authMap.bibs).toBeDefined();
            }
        );

        it(
            "create, read, and write bib and auth records",
            function() {
                // create record
                let auth = new Auth();
                
                // write
                let field = auth.createField("007");
                field.value = "foobar";
                
                field = auth.createField("100");
                let subfield = field.createSubfield("a");
                subfield.value = "foo";
                
                for (let i = 0; i < 5; i++) {
                    // repeated fields
                    field = auth.createField("900"); // creates field, adds to record, returns the field
                    subfield = field.createSubfield("a"); // creates subfield, adds to field, returns the subfield
                    subfield.value = `bar ${i}`;
                    
                    // repeated subfield
                    let repeatedSubfield = field.createSubfield("a");
                    repeatedSubfield.value = `baz ${i}`;
                    
                    // repeated controlfield
                    field = auth.createField("009"); // knows the field should be a ControlField based on tag
                    expect(field.constructor.name).toEqual("ControlField");
                    field.value = "foobarbaz";
                    
                    // chain create methods
                    subfield = auth.createField("200").createSubfield("a");
                    expect(subfield.constructor.name).toEqual("Subfield");
                    subfield.value = "foobaz";
                }
                
                // iterate
                for (let field of auth.fields) {
                    expect(field.tag).toBeDefined();
                    
                    if (field.constructor.name === "ControlField") { // same as `field.tag.match(/^00/)`)
                        expect(field.value).toBeDefined();
                    }
                    
                    if (field.constructor.name === "DataField") { // same as `!field.tag.match(/^00/)`)
                        for (let subfield of field.subfields) {
                            expect(subfield.constructor.name).toEqual("Subfield");
                            expect(subfield.code).toBeDefined();
                            expect(subfield.value).toBeDefined();
                        }
                    }
                }

                // get 
                field = auth.getField("007");
                expect(field.value).toEqual("foobar");
                
                field = auth.getField("100");
                expect(field).toBeInstanceOf(DataField);
    
                subfield = field.getSubfield("a");
                expect(subfield.constructor.name).toEqual("Subfield");
                expect(subfield.code).toEqual("a");
                expect(subfield.value).toEqual("foo");
                
                field = auth.getField("900", 3); // gets the 4th instance of field 900
                expect(field).toBeInstanceOf(DataField);
                expect(field.getSubfield("a").value).toEqual("bar 3");
                expect(field.getSubfield("a", 1).value).toEqual("baz 3"); // gets the second instance of subfield a
                
                let fields = auth.getFields("900"); // gets all instances of field
                expect(fields.length).toBeGreaterThan(0);
                
                subfield = auth.getField("900", 4).getSubfield("a", 1); // chain get methods
                expect(subfield.value).toEqual("baz 4");
            }
        );
        
        it(
            "post, get, put, delete",
            async function() {
                let auth = new Auth();
                auth.createField("100").createSubfield("a").value = "New record";
                expect(auth.saved).toBe(false);
                
                // post
                await auth.save();
                expect(auth.recordId).toBeGreaterThan(0); // backend creates the ID                
                expect(auth.saved).toBe(true);
                
                // get the same record by ID
                let authReloaded = await Auth.get(auth.recordId);
                expect(authReloaded).toBeInstanceOf(AuthRecord);
                expect(authReloaded.getField("100").getSubfield("a").value).toEqual("New record");
                expect(authReloaded.saved).toBe(true);

                // put
                authReloaded.getField("100").getSubfield("a").value = "Updated record";
                expect(authReloaded.saved).toBe(false);
                await authReloaded.save();
                expect(authReloaded.saved).toBe(true);

                // delete
                let oldId = authReloaded.recordId;
                await authReloaded.delete();
                expect(authReloaded.recordId).toBeNull();

                try {
                    await Jmarc.get("auths", oldId);
                    fail("Should have thrown error");
                } catch (err) {
                    expect(err.message).toMatch(/not found/i);
                }
            }
        );

        it(
            "use Bib and Auth aliases",
            async function() {
                let bib = new Bib();
                expect(bib).toBeInstanceOf(BibRecord);
                expect(bib.collection).toEqual("bibs");

                let auth = new Auth();
                expect(auth).toBeInstanceOf(AuthRecord);
                expect(auth.collection).toEqual("auths");
            }
        );

        it(
            "use Jmarc.get() facade for both collections",
            async function() {
                // Create and save records
                let bib = new Bib();
                bib.createField("245").createSubfield("a").value = "Test bib";
                await bib.save();

                let auth = new Auth();
                auth.createField("100").createSubfield("a").value = "Test auth";
                await auth.save();

                // Use facade to get them
                let retrievedBib = await Jmarc.get("bibs", bib.recordId);
                expect(retrievedBib).toBeInstanceOf(BibRecord);
                expect(retrievedBib.getField("245").getSubfield("a").value).toEqual("Test bib");

                let retrievedAuth = await Jmarc.get("auths", auth.recordId);
                expect(retrievedAuth).toBeInstanceOf(AuthRecord);
                expect(retrievedAuth.getField("100").getSubfield("a").value).toEqual("Test auth");
            }
        );
        
        it(
            "determine whether fields are authority-controlled",
            function() {
                let bib = new Bib();
                
                // Verify auth map is loaded
                expect(Jmarc.authMapService.authMap.bibs).toBeDefined();
                expect(Jmarc.authMapService.authMap.bibs["700"]).toBeDefined();
                
                // Test the method
                expect(bib.isAuthorityControlled("700", "a")).toBeTrue();
                expect(bib.isAuthorityControlled("700", "z")).toBeFalse();
                expect(bib.isAuthorityControlled("245", "a")).toBeFalse();
            }
        );
        
        it(
            "lookup of authority-controlled values",
            async function() {
                // create test auth record
                let auth = new Auth();
                let myVal = Math.random().toString();
                auth.createField("100").createSubfield("a").value = myVal;
                await auth.save();
                
                // create test bib record
                let bib = new Bib();
                let field = bib.createField("700");
                field.createSubfield("a").value = myVal;
                
                let choices = await field.lookup();
                expect(choices[0]).toBeInstanceOf(DataField);
                expect(choices[0].getSubfield("a").value).toEqual(myVal);
            }
        );
        
        it(
            "record history",
            async function() {
                // record created
                let bib = new Bib();
                let history = await bib.history();
                expect(history).toEqual([]);
                
                // record saved
                bib.createField("245").createSubfield("a").value = "New record";
                await bib.save();
                history = await bib.history();
                expect(history[0]).toBeInstanceOf(BibRecord);
                expect(history[0].getField("245").getSubfield("a").value).toEqual("New record");
                expect(history[0].updated).toBeDefined(); // ISO date string
                expect(history[0].user).toEqual("testing");

                // record updated
                bib.getField("245").getSubfield("a").value = "Updated";
                await bib.save();
                // history is updated 
                history = await bib.history();
                expect(history[1].getField("245").getSubfield("a").value).toEqual("Updated");

                // revert
                bib.parse(history[0].compile()); // parse the version data into the record
                await bib.save();
                expect(bib.getField("245").getSubfield("a").value).toEqual("New record");
            }
        );

        it(
            "diff",
            function() {
                // test records
                let record1 = new Bib();
                let record2 = new Bib();
                record1.createField("245").createSubfield("a").value = "Same";
                record1.createField("999").createSubfield("a").value = "1";
                record2.createField("245").createSubfield("a").value = "Same";
                record2.createField("999").createSubfield("a").value = "2";
                
                // diff
                let diff = record1.diff(record2);
                expect(diff).toBeInstanceOf(BibRecord);
                expect(diff.getField("245").isDiff).toBeFalse();
                expect(diff.getField("999").isDiff).toBeTrue();
            }
        );
        
        it(
            "clone",
            function() {
                let bib = new Bib();
                bib.createField("245").createSubfield("a").value = "A record that will be cloned";
                let cloned = bib.clone();
                expect(cloned).toBeInstanceOf(BibRecord);
                expect(cloned.getField("245").getSubfield("a").value).toEqual("A record that will be cloned");
            }
        );
        
        it(
            "delete fields",
            function() {
                // all fields of tag
                let auth = new Auth();
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
                let field = auth.createField("999");
                field.createSubfield("a").value = "Val";
                auth.deleteField(field);
                expect(auth.getField("999")).toBeUndefined();
            }
        );
        
        it(
            "delete subfields",
            function() {
                // all subfields of code
                let bib = new Bib();
                let field = bib.createField("900");
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
                let subfield = field.createSubfield("c");
                subfield.value = "Val";
                field.deleteSubfield(subfield); // use the subfield object to delete
                expect(field.getSubfield("c")).toBeUndefined();
            }
        );
        
        it(
            "workforms - list, create, fetch, and delete",
            async function() {
                let workforms = await Bib.listWorkforms();
                expect(Array.isArray(workforms)).toBe(true);
                
                // Clean up any existing test workforms
                for (let name of workforms) {
                    if (name.includes("Test_workform")) {
                        const deleted = await Bib.deleteWorkform(name);
                        expect(deleted).toBe(true);
                    }
                }
                
                // Create and save workform
                let bib = new Bib();
                bib.createField("245").createSubfield("a").value = "Test value";
                const saved = await bib.saveAsWorkform("Test_workform", "The description");
                expect(saved).toBe(true);

                // List and verify
                let names = await Bib.listWorkforms();
                expect(names).toContain("Test_workform");

                // Load from workform
                let loadedBib = await Bib.loadWorkform("Test_workform");
                expect(loadedBib).toBeInstanceOf(BibRecord);
                expect(loadedBib.getField("245").getSubfield("a").value).toEqual("Test value");

                // Clean up
                const finalDelete = await Bib.deleteWorkform("Test_workform");
                expect(finalDelete).toBe(true);
            }
        );

        it(
            "validation warnings",
            function() {
                let bib = new Bib();
                
                // Get warnings before validation
                let warnings = bib.allValidationWarnings();
                expect(Array.isArray(warnings)).toBe(true);
                
                // Create valid field
                bib.createField("245").createSubfield("a").value = "Test";
                
                // Should have fewer warnings now
                let newWarnings = bib.allValidationWarnings();
                expect(Array.isArray(newWarnings)).toBe(true);
            }
        );

        it(
            "undo/redo tracking",
            function() {
                let bib = new Bib();
                
                // Add initial field
                bib.createField("245").createSubfield("a").value = "Original";
                
                // Change the value
                bib.getField("245").getSubfield("a").value = "Modified";
                let compiled1 = bib.compile();
                
                // Undo should restore original
                let undone = bib.undo();
                if (undone) {
                    expect(bib.getField("245").getSubfield("a").value).toEqual("Original");
                    
                    // Redo should return to modified
                    let redone = bib.redo();
                    if (redone) {
                        expect(bib.getField("245").getSubfield("a").value).toEqual("Modified");
                    }
                }
            }
        );

        it(
            "handle virtual collections (speeches and votes)",
            function() {
                let bib = new Bib();
                
                // Default collection
                expect(bib.getVirtualCollection()).toEqual("bibs");
                
                // Speech collection
                let field089 = bib.createField("089");
                field089.createSubfield("b").value = "B22";
                expect(bib.getVirtualCollection()).toEqual("speeches");
                
                // Clear and test votes
                bib.deleteField("089");
                field089 = bib.createField("089");
                field089.createSubfield("b").value = "B23";
                expect(bib.getVirtualCollection()).toEqual("votes");
            }
        );

        it(
            "check saved state",
            async function() {
                let bib = new Bib();
                let field = bib.createField("245");
                field.createSubfield("a").value = "test";
                field.indicators = ["1", "4"];
                
                expect(bib.saved).toBe(false);
                
                await bib.save();   
                expect(bib.saved).toBe(true);
                
                // Make a change
                field.indicators = ["0", "4"];
                expect(bib.saved).toBe(false);

                // Save again
                await bib.save();
                expect(bib.saved).toBe(true);
            }
        );

        it(
            "authority record specific methods",
            async function() {
                let auth = new Auth();
                auth.createField("100").createSubfield("a").value = "Unique heading " + Math.random();
                
                // Test that heading field is required
                let emptyAuth = new Auth();
                expect(function() {
                    emptyAuth.validate();
                }).toThrowError(/Heading field required/);
            }
        );

        it(
            "injection of services into records",
            function() {
                let bib = new Bib();
                
                expect(bib.authMapService).toBeDefined();
                expect(bib.validationService).toBeDefined();
                expect(bib.repository).toBeDefined();
                expect(bib.undoRedoManager).toBeDefined();
            }
        );
    }
);