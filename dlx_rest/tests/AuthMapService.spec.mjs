/* This is a Jasmine test suite https://jasmine.github.io/

To install the Node dependencies run `npm install node-fetch rollup jasmine`

To run the spec run `jasmine <path to this file>` 

The Flask app must be currently running in TESTING mode. Export/setx 
DLX_REST_TESTING to a true value before starting the app. If the app is not in
TESTING mode, the spec will fail at the app login prompt */

"use strict";

import { AuthMapService } from "../static/js/api/services/AuthMapService.mjs";
import { MockServer } from './mockServer.mjs';
import fetch from "node-fetch";

if (! globalThis.fetch) {
    globalThis.fetch = fetch;
}

describe(
    "AuthMapService",
    function() {
        let authMapService;
        let mockServer;

        beforeEach(function() {
            mockServer = new MockServer();
            authMapService = new AuthMapService("http://localhost:5000/api/");
        });

        afterEach(function() {
            mockServer.restore();
        });

        it(
            "initializes with empty maps",
            function() {
                expect(authMapService.maps.bibs).toEqual({});
                expect(authMapService.maps.auths).toEqual({});
                expect(authMapService.maps.speeches).toEqual({});
                expect(authMapService.maps.votes).toEqual({});
                expect(authMapService.isLoaded).toBeFalse();
            }
        );

        it(
            "normalizes API URL with trailing slash",
            function() {
                let service1 = new AuthMapService("http://localhost:5000/api/");
                let service2 = new AuthMapService("http://localhost:5000/api");
                
                expect(service1.apiUrl).toEqual("http://localhost:5000/api/");
                expect(service2.apiUrl).toEqual("http://localhost:5000/api/");
            }
        );

        it(
            "loads authority maps for all collections",
            async function() {
                await authMapService.load();
                expect(authMapService.isLoaded).toBeTrue();
                expect(authMapService.maps.bibs).toBeDefined();
                expect(authMapService.maps.auths).toBeDefined();
            }
        );

        it(
            "checks if field/subfield is authority-controlled",
            async function() {
                await authMapService.load();
                
                // Test with a known authority-controlled field
                expect(authMapService.isAuthorityControlled("bibs", "700", "a")).toBeTrue();
            }
        );

        it(
            "gets authority-controlled subfields for a field",
            async function() {
                await authMapService.load();
                
                let subfields = authMapService.getAuthorityControlledSubfields("bibs", "700");
                expect(subfields).toBeInstanceOf(Array);
                expect(subfields.length).toBeGreaterThan(0);
            }
        );

        it(
            "gets map for a specific collection",
            async function() {
                await authMapService.load();
                
                let bibsMap = authMapService.getMap("bibs");
                expect(bibsMap).toEqual(jasmine.any(Object));
            }
        );

        it(
            "clears all maps",
            async function() {
                await authMapService.load();
                expect(authMapService.isLoaded).toBeTrue();
                
                authMapService.clear();
                expect(authMapService.isLoaded).toBeFalse();
                expect(authMapService.maps.bibs).toEqual({});
                expect(authMapService.maps.auths).toEqual({});
            }
        );

        it(
            "warns when accessing maps before loading",
            async function() {
                spyOn(console, 'warn');
                
                authMapService.getMap("bibs");
                expect(console.warn).toHaveBeenCalled();
            }
        );
    }
);