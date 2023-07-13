import { Jmarc } from './jmarc.mjs'

export let importcomponent = new Vue({
    el: "#import_marc",
    props: ["api_prefix"],
    template: `
    <div class="container">
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
        <div class="container">
            <div class="row" v-for="record in records">{{record}}</div>
        </div>
    </div>`,
    data: function () { 
        return {
            // Setting the import type here lets us expand this later
            importType: "records",
            // And choose different kinds of uploads we want to accept
            accept: ".mrk, .xml",
            fileList: [],
            records: []
        }
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
            console.log("Got",file)
            const reader = new FileReader()
            let fileText = ""
            reader.onload = (res) => {
                this.records = res.target.result.split("\r\s*\n")
            }
            reader.readAsText(file)
        }
    }
})