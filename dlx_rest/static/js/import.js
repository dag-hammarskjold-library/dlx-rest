import { Jmarc } from './jmarc.mjs'

export let importcomponent = {
    props: ["api_prefix"],
    template: `
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
                        Records with fatal errors preventing import: {{unimportableRecords}}<br>
                        Invalid records that can still be imported: {{invalidRecords}}
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
                                <label class="custom-control-label" for="customSwitch1">Show Errors</label>
                            </div>
                            
                        </form>
                    </div>
                    <div class="col-sm-2">{{records.length}} {{this.collection.replace("s","")}} record(s)</div>
                </div>
                <div class="row border-bottom py-2 my-2" v-for="record in records">
                    <!-- display each record, cleaning up how it appears onscreen -->
                    <div class="col-sm-1">
                        <input v-if="record['fatalErrors'].length == 0" type="checkbox" class="checkbox" :checked="record.checked" @change="record.checked = !record.checked">
                    </div>
                    <div class="col-sm-9">
                        <div v-if="showErrors && record['validationErrors'].length > 0" class="alert alert-warning">
                            <div v-for="flag in record['validationErrors']">{{flag.message}}</div>
                        </div>
                        <div v-if="showErrors && record['fatalErrors'].length > 0" class="alert alert-danger">
                            <div v-for="flag in record['fatalErrors']">{{flag.message}}</div>
                        </div>
                        <!-- use this for debugging
                        <div><pre>{{record['mrk']}}</pre></div>
                        -->
                        <div v-for="field in record['jmarc'].fields" class="field" :data-tag="field.tag">
                            <code v-if="field.subfields" class="text-primary">{{field.tag}}</code>
                            <span v-for="subfield in field.subfields">
                                <code>\${{subfield.code}}</code>{{subfield.value}}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="ml-auto mb-4">
                        <button type="button" class="btn btn-secondary" @click="reinitApp">Start Over</button>
                        <button type="button" class="btn btn-primary ml-3" @click="submitSelected">Submit Selected Records</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="state == 'review'">
            <h5>Review</h5>
            <div v-for="record in records">
                <div v-if="record.jmarc.recordId">
                    Imported record ID: <a :href="uiBase + 'editor?records=' + record['jmarc'].collection + '/' + record['jmarc'].recordId">{{record.jmarc.recordId}}</a><br>
                    <div v-for="field in record['jmarc'].fields" class="field" :data-tag="field.tag">
                        <code v-if="field.subfields" class="text-primary">{{field.tag}}</code>
                        <span v-for="subfield in field.subfields">
                            <code>\${{subfield.code}}</code>{{subfield.value}}
                        </span>
                    </div>
                </div>
            </div>
            <button type="button" class="btn btn-secondary" @click="reinitApp">Start Over</button>
        </div>
    </div>`,
    data: function () { 
        return {
            // Setting the import type here lets us expand this later
            importType: "records",
            // And choose different kinds of uploads we want to accept
            accept: ".mrk, .xml",
            fileList: [],
            collection: "bibs",
            records: [],
            state: "init",
            showPreviewModal: false,
            issues: 0,
            uiBase: "",
            showErrors: false,
            detectedSpinner: false
        }
    },
    created: function () {
        Jmarc.apiUrl = this.api_prefix
        this.uiBase = this.api_prefix.replace("/api", "")
    },
    computed: {
        unimportableRecords: function () {
            let count = 0
            for (let record of this.records) {
                if (record.fatalErrors.length > 0) {
                    count = count + 1
                }
            }
            return count
        },
        invalidRecords: function () {
            let count = 0
            for (let record of this.records) {
                if (record.validationErrors.length > 0 && record.fatalErrors.length === 0) {
                    count = count + 1
                }
            }
            return count
        }
    },
    methods: {
        reinitApp: function () {
            this.records = []
            this.showErrors=false
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
                this.parse(this.fileList[0])
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
        parse(file) {
            /* 
            Take the file and split it, in case it contains multiple records,
            then check if all authorities exist and that it's not a duplicate
            symbol.
            */
            this.state = "preview"
            const reader = new FileReader()
            let fileText = ""
            reader.readAsText(file)
            const promises = []
            this.detectedSpinner = true
            reader.onload = (res) => {
                for (let mrk of res.target.result.split(/(\r\n *\r\n|\n *\n)/)) {
                    let promise = Jmarc.fromMrk(this.collection, mrk).then( jmarc => {
                        // The only classes of validation errors we care about are:
                        // 1. Is there a duplicate symbol? If so, warn but allow import.
                        // 2. Do all the auth controlled fields match existing auth 
                        //    records? If not, error and prevent import.
                        let validationErrors = []
                        let fatalErrors = []

                        if (jmarc.fields.length > 0) {
                            jmarc.symbolInUse().then( symbolInUse => {
                                if (symbolInUse) {
                                    this.issues += 1
                                    validationErrors.push({"message": "Duplicate Symbol Warning: The symbol for this record is already in use."})
                                }
                            });

                            for (let field of jmarc.fields.filter(x => ! x.tag.match(/^00/))) {
                                for (let subfield of field.subfields.filter(x => 'xref' in x)) {
                                    if (subfield.xref instanceof Error) {
                                        // unresolved xrefs are set to an Error object
                                        fatalErrors.push({"message": `Fatal: ${field.tag}$${subfield.code} ${subfield.xref.message}: ${subfield.value}`})
                                    }
                                }
                            }

                            this.records.push({"jmarc": jmarc, "mrk": mrk, "validationErrors": validationErrors, "fatalErrors": fatalErrors, "checked": false})
                        }
                    }).catch(error => {
                        throw error
                    })

                    promises.push(promise)
                }

                Promise.all(promises).then(x => this.detectedSpinner = false)
            }
            
        },
        selectAll() {
            for (let record of this.records) {
                if (record.fatalErrors.length == 0) {
                    record.checked = true
                }
            }
        },
        selectNone() {
            for (let record of this.records) {
                record.checked = false
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
            return jmarc.post()
                .catch(error => {
                    // may need some user notifcation here?
                    throw error
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
                if (e.target.value > 0 || values.length > 0){
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