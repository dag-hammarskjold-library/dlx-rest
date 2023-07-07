import { Jmarc } from './jmarc.mjs'

export let importcomponent = new Vue({
    el: "#import_marc",
    props: ["api_prefix"],
    template: `
    <div class="container">
        <h2>Import</h2>
        <div @drop.prevent @dragover.prevent>
            <div class="border border-dark rounded" @dragenter="handleDragEnter" @dragleave="handleDragLeave" @drop="handleDrop" style="border-style: dotted;">
                <h5>Drag and Drop</h5>
                <input id="import" type="file" multiple="" style="opacity: 0;" @change="handleChange" />
            </div>
        </div>
    </div>`,
    data: function () { 
        return {
            fileList: []
        }
    },
    methods: {
        handleChange: function (event) {
            this.fileList = []
        },
        handleDragEnter: function (event) {
            event.preventDefault()
            console.log("dragover")
            event.currentTarget.classList.add("bg-light")
        },
        handleDragLeave: function (event) {
            //event.preventDefault()
            console.log("dragoverleave")
            event.currentTarget.classList.remove("bg-light")
        },
        handleDrop: function (event) {
            event.preventDefault()
            console.log("drop")
            this.handleChange()
        }
    }
})