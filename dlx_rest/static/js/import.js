import { Jmarc } from './jmarc.mjs'

export let importcomponent = {
    props: ["api_prefix"],
    template: `
    <div id="foo" class="container">
        <div v-if="state == 'init'">
            <h4>Import Records</h4>
            <div @drop.prevent @dragover.prevent @click="handleClick">
                <div class="text-center" @dragenter="handleDragEnter" @dragleave="handleDragLeave" @drop="handleDrop" style="border: 3px dashed #dadfe3; border-radius: 15px;">
                    <h4 class="text-uppercase text-secondary mt-2" style="pointer-events:none;">Drag and Drop</h4>
                    <p class="text-center" style="pointer-events:none;">or</p>
                    <p class="text-center" style="pointer-events:none;"><a class="btn btn-success text-light">Click here to browse</a></p>
                    <input v-if="importType == 'records'" id="import" ref="import" type="file" style="opacity: 0; pointer-events:none;" @change="handleChange" :accept="accept" />
                    <input v-else id="import" ref="import" type="file" multiple="" style="opacity: 0; pointer-events:none;" @change="handleChange" :accept="accept" />
                </div>
            </div>
        </div>
        <div class="row" v-if="state == 'preview'">
            <div class="container">
                <div class="row">
                    <div v-if="records.length > 0" class="col alert alert-warning">
                        Records that can be imported with no issue: {{records.length - issues}}/{{records.length}}
                        <br/>
                        Records that have issues: {{issues}}/{{records.length}}
                    </div>
                </div>
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
                    <div class="col-sm-2">{{records.length}} records</div>
                </div>
                <div class="row border-bottom py-2 my-2" v-for="record in records">
                    <!-- display each record, cleaning up how it appears onscreen -->
                    <div class="col-sm-1">
                        <input v-if="record['fatalErrors'].length == 0" type="checkbox" class="checkbox">
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
            </div>
        </div>
        <div v-if="state == 'review'">
            <div v-for="record in records">
                <div v-if="record.id">{{record.id}}</div>
            </div>
        </div>
    </div>`,
    data: function () { 
        return {
            // Setting the import type here lets us expand this later
            importType: "records",
            // And choose different kinds of uploads we want to accept
            accept: ".mrk, .xml",
            fileList: [],
            records: [],
            state: "init",
            showPreviewModal: false,
            issues: 0,
            uiBase: "",
            showErrors: false
        }
    },
    created: function () {
        Jmarc.apiUrl = this.api_prefix
        this.uiBase = this.api_prefix.replace("/api", "")
    },
    methods: {
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
            then attempt to validate the MARC using either jmarc.mjs (preferred)
            OR dlx (via the dlx_rest API). Display the results onscreen 
            (this.records) and show validation errors, as well as an import 
            button.
            */
            this.state = "preview"
            const reader = new FileReader()
            let fileText = ""
            reader.readAsText(file)
            reader.onload = (res) => {
                for (let mrk of res.target.result.split(/[\r\n]{2,}/)) {
                    Jmarc.fromMrk(mrk, "bibs").then( jmarc => {
                        // The only classes of validation errors we care about are:
                        // 1. Is there a duplicate symbol? If so, warn but allow import.
                        // 2. Do all the auth controlled fields match existing auth 
                        //    records? If not, error and prevent import.
                        //let validationErrors = jmarc.allValidationWarnings().filter((x) => !x.message.includes("indicators"))
                        let validationErrors = []
                        let fatalErrors = []
                        if (jmarc.fields.length > 0) {
                            jmarc.symbolInUse().then( symbolInUse => {
                                if (symbolInUse) {
                                    this.issues += 1
                                    validationErrors.push({"message": "Duplicate Symbol Warning: The symbol for this record is already in use."})
                                }
                            })
                            /* This is supposed to check to see if you have unmatched or ambiguous authorities,
                               which prevents import because it will cause an error. It's not *quite* doing what
                               it's intended to do, because it fails to match on existing authorities unless 
                               they are single field, single word matches */
                            for (let field of jmarc.fields) {
                                let auth = jmarc.authMap[field.tag]
                                if (auth) {
                                    let headingTag = Object.values(auth)[0] 
                                    let thisAuth = new Jmarc("auths")
                                    let newField = thisAuth.createField(headingTag)
                                    for (let subfield of field.subfields) {
                                        if (Object.keys(auth).includes(subfield.code)) {
                                            let newSub = newField.createSubfield(subfield.code)
                                            newSub.value = subfield.value
                                        }
                                    }
                                    thisAuth.authExists().then( authExists => {
                                        if (!authExists) {
                                            fatalErrors.push({"message": `Fatal: ${field.tag} ${field.toStr()} has an unmatched or ambiguous authority value. Create the authority record or edit this record before importing.`})
                                        }
                                    })
                                }   
                            }
                            /* */
                            this.records.push({"jmarc": jmarc, "mrk": mrk, "validationErrors": validationErrors, "fatalErrors": fatalErrors})
                            //console.log(fatalErrors)
                        }
                    })
                }
            }
            
        },
        selectAll() {
            for (let el of document.getElementsByClassName("checkbox")) {
                el.checked = true
            }
        },
        selectNone() {
            for (let el of document.getElementsByClassName("checkbox")) {
                el.checked = false
            }
        },
        submit(e, record) {
            let binary = new Blob([record['mrk']])
            let jmarc = record['jmarc']
            // Only allow one click, so we don't accidentally post multiple records
            e.target.classList.add("disabled")            
            jmarc.post_mrk(binary).then(
                response => {
                    jmarc.recordId = response.recordId
                    return response
                }
            )
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