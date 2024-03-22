import { Jmarc } from "../jmarc.mjs"

export let exportmodal = {
    props: ["links"],
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
                  <li class="list-group-item"><a @click="setFormat('csv')">CSV</a></li>
                  <li class="list-group-item"><a @click="setFormat('mrk')">MRK</a></li>
                  <li class="list-group-item"><a @click="setFormat('xml')">XML</a></li>
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
            selectedExportUrl: this["links"],
            results: []
        }
    },
    methods: {
        show: async function() {
            this.showModal = true
        },
        setFormat(format) {
          let exportUrl = this["links"][format.toUpperCase()]
          let previewUrl = this["links"]["brief"].replace(/\&limit=\d{1,3}/, "&limit=5")
          fetch(previewUrl).then(response => response.json().then( jsonData => {
            console.log(jsonData)
            this.results = jsonData.data
          }))
        }
    }
}