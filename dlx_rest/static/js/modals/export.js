import { Jmarc } from "../jmarc.mjs"

export let exportmodal = {
    props: {
        links: {
            type: Object
        }
    },
    template: `<div v-if="showModal">
    <transition name="modal">
      <div class="modal-mask">
        <div class="modal-wrapper">
          <div class="modal-dialog modal-xl" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Export Results</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true" @click="showModal = false">&times;</span>
                </button>
              </div>
              <div id="results-spinner" class="col d-flex justify-content-center">
                    <div class="spinner-border" role="status" v-show="showSpinner">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>
              
              <div id="preview-text" class="modal-body">
                <div class="container" id="format-select">
                  Select format:
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio2" value="option2" @click="setFormat('mrk')" checked>
                    <label class="form-check-label" for="inlineRadio2">MRK</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio3" value="option3" @click="setFormat('xml')">
                    <label class="form-check-label" for="inlineRadio3">XML</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio1" value="option1" @click="setFormat('csv')">
                    <label class="form-check-label" for="inlineRadio1">CSV</label>
                  </div>
                  <br/>
                  <span>Output Fields: </span>
                  <input type="text" placeholder="comma separated list of fields (tags only)" @keyup="setOutputFields($event)">
                </div>
              </div>
              <div class="modal-footer">
                <a :href="selectedExportUrl" :download="'export.' + selectedFormat">
                  <button type="button" class="btn btn-primary">Submit</button>
                </a>
                <!-- <button type="button" class="btn btn-primary" @click="submitExport">Submit</button> -->
                <!-- <button type="button" class="btn btn-danger" @click="showModal = false">Close</button> -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>`,
    data: function() {
        return {
            showModal: false,
            showSpinner: false,
            selectedFormat: 'mrk',
            selectedFields: null,
            selectedExportUrl: null
        }
    },
    methods: {
        show: async function() {
            this.showModal = true
            this.setFormat('mrk')
        },
        setFormat(format) {
          this.selectedFormat = format
          this.selectedExportUrl = this.links.format[format.toUpperCase()]
        },
        setOutputFields(e) {
            this.selectedFields = e.target.value
            let url = new URL(this.selectedExportUrl)
            let search = new URLSearchParams(url.search)
            search.set("fields", e.target.value)
            url.search = search
            this.selectedExportUrl = url
        },
        /* submitExport() {
            fetch(this.selectedExportUrl).then( response => {
                response.blob().then( blob => {
                    this.download(blob, `export.${this.selectedFormat}`)
                })
            })
        },
        download(blob, filename) {
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.style.display = "none"
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } */
    }
}