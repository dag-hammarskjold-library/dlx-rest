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
              <div class="container" id="format-select">
                Select format
                <ul class="list-group list-group-horizontal-sm">
                  <li class="list-group-item"><a href="#" @click="setFormat('csv')">CSV</a></li>
                  <li class="list-group-item"><a href="#" @click="setFormat('mrk')">MRK</a></li>
                  <li class="list-group-item"><a href="#" @click="setFormat('xml')">XML</a></li>
                </ul>
              </div>
              <div id="preview-text" class="modal-body">
                <div v-for="record in results">
                  {{record.toString()}}
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="showModal = false">Close</button>
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
            selectedExportUrl: null,
            results: []
        }
    },
    methods: {
        show: async function() {
            this.showModal = true
        },
        setFormat(format) {
          this.selectedExportUrl = this.links.format[format.toUpperCase()]
          this.submitExport(format)
        },
        setOutputFields(fields) {
            if (this.selectedExportUrl) {
                this.selectedExportUrl = `${this.selectedExportUrl}&of=${encodeURIComponent(fields)}`
            }
        },
        submitExport(format) {
            fetch(this.selectedExportUrl).then( response => {
                response.blob().then( blob => {
                    this.download(blob, `export.${format}`)
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
        }
    }
}