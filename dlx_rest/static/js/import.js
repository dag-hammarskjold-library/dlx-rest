import { Jmarc } from './jmarc.mjs'
import { previewmodal } from './modals/preview.js'

export let importcomponent = {
    props: ["api_prefix"],
    template: `
    <div id="foo" class="container">
        <div v-if="!review">
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
        <div class="row">
            <div class="container">
                <div class="row" v-for="record in records">
                    <!-- display each record, cleaning up how it appears onscreen -->
                    <div class="col">
                        <h4>Record: (id)</h4>
                        
                    </div>
                </div>
            </div>
        </div>
        <previewmodal :api_prefix="api_prefix" collection_name="Bibs"></previewmodal>
    </div>`,
    data: function () { 
        console.log(this.api_prefix)
        return {
            // Setting the import type here lets us expand this later
            importType: "records",
            // And choose different kinds of uploads we want to accept
            accept: ".mrk, .xml",
            fileList: [],
            records: [],
            review: false,
            showPreviewModal: false
        }
    },
    created: function () {
        Jmarc.apiUrl = this.api_prefix
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
                //event.currentTarget.classList.remove('bg-gray-100');
                //event.currentTarget.classList.add('bg-green-300');
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
            //console.log("Got",file)
            this.review = true
            const reader = new FileReader()
            let fileText = ""
            reader.readAsText(file)
            reader.onload = (res) => {
                console.log("Loading")
                for (let r of res.target.result.split("\r\s*\n")) {
                    console.log(r)
                    let jmarc = new Jmarc("bibs")
                    let parsed = Jmarc.from_mrk(r, "bibs")
                    console.log(parsed)
                    this.records.push(parsed)
                }
                console.log(this.records)
            }
            
        },
        submit(records) {
            /* loop through the valid records and submit each one to the endpoint */
        }
    },
    components: {
        "previewmodal": previewmodal
    }
}