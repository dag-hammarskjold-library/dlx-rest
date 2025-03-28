import { DataField, Jmarc } from './jmarc.mjs'
import user from "./api/user.js"
import { CSV } from './csv.mjs'

export let importcomponent = {
    props: ["api_prefix"],
    template: /* html */ `
    <div id="foo" class="container">
        <h4>Import Records</h4>
        <div v-if="state == 'init'">
            <h5>Select Files</h5>
            <p>Ensure that all records in the file are of the same type (bibs or auths).</p>
            <div class="row mb-2">
                <div class="col">
                    Select Collection:
                    <select class="form-select" aria-label="Set Collection" @change="setCollection">
                        <option value="bibs">Bibs</option>
                        <option value="auths">Auths</option>
                    </select>
                </div>
            </div>
            <div @drop.prevent @dragover.prevent @click="handleClick">
                <div class="text-center" @dragenter="handleDragEnter" @dragleave="handleDragLeave" @drop="handleDrop" style="border: 3px dashed #dadfe3; border-radius: 15px;">
                    <h4 class="text-uppercase text-secondary mt-2" style="pointer-events:none;">Drag and Drop</h4>
                    <p class="text-center" style="pointer-events:none;">or</p>
                    <p class="text-center" style="pointer-events:none;"><button type="button" class="btn btn-success text-light">Click here to browse</button></p>
                    <input v-if="importType == 'records'" id="import" ref="import" type="file" style="opacity: 0; pointer-events:none;" @change="handleChange" :accept="accept" />
                    <input v-else id="import" ref="import" type="file" multiple="" style="opacity: 0; pointer-events:none;" @change="handleChange" :accept="accept" />
                </div>
            </div>
        </div>
        <div v-if="state == 'preview'">
            <h5>Preview</h5>
            <div class="container">
                <div class="row">
                    <div v-if="records.length > 0" class="col alert alert-warning">
                        Target collection: {{collection}} <br>
                        Records detected: {{records.length}} 
                        <i v-if="detectedSpinner" class="fa fa-spinner fa-pulse"></i> 
                        <i v-else class="fa fa-check"></i>
                        <br>
                        Records with fatal errors preventing import: {{fatalErrors.length}}<br>
                        Records with validation warnings that can still be imported: {{recordsWithWarnings}}
                    </div>
                </div>
                <div v-if="records.length === 0" class="fa fa-spinner fa-5x fa-pulse"></div>
                <div v-if="records.length > 0" class="row py-2 border-bottom">
                    <div class="col-sm-2">Select <a href="#" @click="selectAll">All</a> | <a href="#"@click="selectNone">None</a></div>
                    <div class="col">    
                        <form class="form">
                            <div class="input-group">
                                <div class="input-group-prepend"><div class="input-group-text"><i class="fas fa-filter mr-2"></i></div></div>
                                <input class="form-control" type="text" @keyup="filterView($event)" placeholder="Comma separated list of fields to filter">
                            </div>
                            <div class="custom-control custom-switch">
                                <input type="checkbox" class="custom-control-input" id="customSwitch1" @change="showErrors = !showErrors">
                                <label class="custom-control-label" for="customSwitch1">Show Errors and Warnings</label>
                            </div>
                            
                        </form>
                    </div>
                    <div class="col-sm-2">{{records.length}} {{this.collection.replace("s","")}} record(s)</div>
                </div>
                <div v-if="showErrors && fatalErrors">
                    <!-- needs styling -->
                    <div v-for="error in fatalErrors">
                        <pre>{{ error }}</pre>
                    </div>
                </div>
                <div class="row border-bottom py-2 my-2" v-for="record in records">
                    <!-- display each record, cleaning up how it appears onscreen -->
                    <div class="col-sm-1">
                        <!-- <input v-if="record['fatalErrors'].length == 0" type="checkbox" class="checkbox" :checked="record.checked" @change="toggleSubmit(record)"> -->
                        <input type="checkbox" class="checkbox" :checked="record.checked" @change="toggleSubmit(record)">
                    </div>
                    <div class="col-sm-9">
                        <div v-if="showErrors && record['validationWarnings'].length > 0" class="alert alert-warning">
                            <div v-for="flag in record['validationWarnings']">{{flag.message}}</div>
                        </div>
                        <!-- use this for debugging
                        <div><pre>{{record['mrk']}}</pre></div>
                        -->
                        <div v-for="field in record['jmarc'].fields" class="field" :data-tag="field.tag">
                            <div v-if="field.subfields">
                                <code class="text-primary">{{field.tag}}</code>
                                <span v-for="subfield in field.subfields">
                                    <code>\${{subfield.code}}</code>{{subfield.value}}
                                </span>
                            </div>
                            <!-- Show control fields if they were in the import, e.g., as export output -->
                            <div v-else>
                                <code class="text-primary">{{field.tag}}</code>
                                <code>{{field.value}}</code>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="ml-auto mb-4">
                        <button type="button" class="btn btn-secondary" @click="reinitApp">Start Over</button>
                        <button v-if="selectedRecordsCount > 0" type="button" class="btn btn-primary ml-3" @click="submitSelected">Submit Selected Records</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="state == 'review'">
            <h5>Review</h5>
            <div v-for="record in records">
                <div v-if="record.jmarc.recordId">
                    <div v-if="record.previousJmarc">
                        Record <a :href="uiBase + 'editor?records=' + record['jmarc'].collection + '/' + record['jmarc'].recordId">{{record.jmarc.recordId}}</a> replaced with:
                        <br>
                        <div v-for="field in record['jmarc'].fields" class="field" :data-tag="field.tag">
                            <code v-if="field.subfields" class="text-primary">{{field.tag}}</code>
                            <span v-for="subfield in field.subfields">
                                <code>\${{subfield.code}}</code>{{subfield.value}}
                            </span>
                        </div>
                    </div>
                    <div v-else>
                        Imported record ID: <a :href="uiBase + 'editor?records=' + record['jmarc'].collection + '/' + record['jmarc'].recordId">{{record.jmarc.recordId}}</a><br>
                        <div v-for="field in record['jmarc'].fields" class="field" :data-tag="field.tag">
                            <code v-if="field.subfields" class="text-primary">{{field.tag}}</code>
                            <span v-for="subfield in field.subfields">
                                <code>\${{subfield.code}}</code>{{subfield.value}}
                            </span>
                        </div>
                    </div>
                </div>
                <hr />
            </div>
            <button type="button" class="btn btn-secondary" @click="reinitApp">Start Over</button>
        </div>
    </div>`,
    data: function () {
        return {
            // Setting the import type here lets us expand this later
            importType: "records",
            // And choose different kinds of uploads we want to accept
            accept: ".mrk, .xml, .csv",
            fileList: [],
            collection: "bibs",
            records: [],
            state: "init",
            showPreviewModal: false,
            issues: 0,
            uiBase: "",
            showErrors: false,
            detectedSpinner: false,
            selected: 0,
            selectedRecords: false,     // this just (de)activates the submit button
            userShort: null,
            myProfile: {},
            fatalErrors: [],
            recordsWithWarnings: 0
        }
    },
    created: async function () {
        Jmarc.apiUrl = this.api_prefix
        this.uiBase = this.api_prefix.replace("/api", "")
        this.myProfile = await user.getProfile(this.api_prefix, 'my_profile')
        // We only need the shortname of the user
        this.userShort = this.myProfile.data.shortname
    },
    computed: {
        selectedRecordsCount: function () {
            let count = 0
            for (let record of this.records) {
                if (record.checked) {
                    count += 1
                }
            }
            return count
        }
    },
    methods: {
        reinitApp: function () {
            this.records = []
            this.showErrors = false
            this.state = 'init'
            this.collection = "bibs"
        },
        setCollection: function (e) {
            this.collection = e.target.value
        },
        handleChange: function () {
            // This replaces the list of files each time. It would be better to concatenate...
            this.fileList = [...this.$refs.import.files]
            if (this.importType == "records") {
                let mimetype = this.fileList[0].type
                
                return this.parseRecords(this.fileList[0], mimetype)
            }
        },
        handleClick: function () {
            this.$refs.import.click()
        },
        handleDragEnter: function (event) {
            event.preventDefault()
            if (!event.currentTarget.classList.contains('bg-dark')) {
                event.currentTarget.classList.add("bg-dark")
            }
        },
        handleDragLeave: function (event) {
            event.currentTarget.classList.remove("bg-dark")
        },
        handleDrop: function (event) {
            event.preventDefault()
            this.$refs.import.files = event.dataTransfer.files
            event.currentTarget.classList.remove("bg-dark")
            this.handleChange()
        },
        parseRecords(file, mimetype) {
            this.state = "preview"
            const reader = new FileReader()
            reader.readAsText(file)
            this.detectedSpinner = true
            let promises = [] // all promises will return the record in raw JSON
            let recordStrings = []
            let format

            reader.onload = (fileEvent) => {
                switch (file.name.slice(-3)) { // files might not have mimetypes
                    case "xml": 
                        format = "xml"
                        const parser = new DOMParser() // use xml parser to split the record nodes
                        const serializer = new XMLSerializer() // use serializer to convert back tos strings
                        const doc = parser.parseFromString(fileEvent.target.result, 'text/xml')
                    
                        doc.querySelectorAll('record').forEach(recordElement => {
                            const string = serializer.serializeToString(recordElement)
                            recordStrings.push(string)
                        })
                        break
                    case "csv":
                        format = "csv"
                        // each record sting must be two lines - one with the header and one with th record data
                        const lines = fileEvent.target.result.split("\n")
                        const header = lines[0]
                        lines.slice(1).forEach(line => {if (line) recordStrings.push(header + "\n" + line)})
                        break
                    case "mrk":
                        format = "mrk"
                        recordStrings = fileEvent.target.result.split(/[\r\n][\r\n]/)
                        break
                }
                
                recordStrings = recordStrings.filter(x => x) // remove empty elements
                let parseUrl = `${this.api_prefix}/marc/${this.collection}/parse?format=` + format

                recordStrings.forEach(string => {
                    let savedResponse

                    const promise = fetch(parseUrl, {method: 'POST', body: string})
                        .then(response => {
                            savedResponse = response
                            return response.json()
                        }).then(json => {
                            if (!savedResponse.ok) {
                                const errorMsg = JSON.stringify(json)
                                this.fatalErrors.push((`Invalid record: \n${errorMsg}\n${string}`))
                            } else {
                                const jmarc = new Jmarc(this.collection)
                                jmarc.parse(json["data"])
                                let validationWarnings = []

                                if (jmarc.fields.length == 0) {
                                    return
                                }

                                if (!jmarc.getField("001")) {
                                    // we only want to check for duplicate symbols if the record is new
                                    // should this be a fatal error?
                                    jmarc.symbolInUse().then(symbolInUse => {
                                        if (symbolInUse) {
                                            this.issues += 1
                                            validationWarnings.push({ "message": "Duplicate Symbol Warning: The symbol for this record is already in use." })
                                        }
                                    });
                                }

                                validationWarnings = validationWarnings.concat(jmarc.allValidationWarnings())
                                this.recordsWithWarnings += 1

                                // Set a field indicating the record was imported
                                let importField = jmarc.createField("999")
                                let importSubfield = importField.createSubfield("a")
                                const today = new Date()
                                // user shortname
                                importSubfield.value = `${this.userShort}i${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
                                importField.new = true

                                this.records.push({ "jmarc": jmarc, "mrk": string, "validationWarnings": validationWarnings})
                            }       
                        }).catch(error => {
                            throw error
                        })

                    promises.push(promise)
                })

                // todo: The order of the records previews might not be in the same order
                // as they were in the file because of async. We may need to consider preserving 
                // the order while still maintaing async.
                Promise.all(promises).then(x => {this.detectedSpinner = false})
            }

            return
        },
        selectAll() {
            for (let record of this.records) {
                record.checked = true
                // we only need one selected record to enable the import button
                this.selectedRecords = true
            }
        },
        selectNone() {
            for (let record of this.records) {
                record.checked = false
            }
            this.selectedRecords = false
        },
        toggleSubmit(r) {
            // This toggles the checked state of the listed records
            // Then determines whether there are any selected records
            // and toggles the submit button so we don's submit 0 records
            r.checked = !r.checked
            this.selectedRecords = false
            for (let record of this.records) {
                if (record.checked) {
                    this.selectedRecords = true
                }
            }
        },
        submitSelected() {
            this.state = "review"
            for (let record of this.records) {
                if (record.checked) {
                    console.log("Submitting record...")
                    this.submit(record)
                }
            }
        },
        async submit(record) {
            let binary = new Blob([record['mrk']])
            let jmarc = record['jmarc']
            // Only allow one click, so we don't accidentally post multiple records
            //e.target.classList.add("disabled")
            let existingId = jmarc.getField("001")
            Jmarc.get(this.collection, existingId.value).then(remoteJmarc => {
                record['previousJmarc'] = remoteJmarc
                remoteJmarc.fields = jmarc.fields
                record['jmarc'] = remoteJmarc
                //remoteJmarc.id = existingId.value
                return remoteJmarc.put()
                    .catch(error => {
                        throw error
                    })
            }).catch(error => {
                return jmarc.post()
                    .catch(error => {
                        // may need some user notifcation here?
                        throw error
                    })
            })
        },
        filterView(e) {
            let values = [e.target.value]
            // Empty the array if the input is empty, otherwise we get an empty string in the array
            if (e.target.value.length == 0) {
                values = []
            }
            // Split the input value if it includes a comma
            if (e.target.value.includes(",")) {
                values = e.target.value.split(",")
            }
            for (let el of document.getElementsByClassName("field")) {
                let found = values.find((v) => el.dataset.tag.startsWith(v))
                if (e.target.value > 0 || values.length > 0) {
                    if (!found) {
                        el.style.display = "none"
                    } else {
                        el.style.display = ""
                    }
                } else {
                    el.style.display = ""
                }
            }
        }
    }
}