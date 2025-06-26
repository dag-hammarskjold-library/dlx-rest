import { Jmarc } from "../api/jmarc.mjs"

export let previewmodal = {
    props: {
        api_prefix: {
            type: String,
            required: true
        },
        collection_name: {
          type: String,
          required: true
        }
    },
    template: `<div v-if="showModal">
    <transition name="modal">
      <div class="modal-mask">
        <div class="modal-wrapper">
          <div class="modal-dialog modal-xl" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">{{collection_name}} / {{recordId}}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true" @click="showModal = false">&times;</span>
                </button>
              </div>
              <div id="results-spinner" class="col d-flex justify-content-center">
                    <div class="spinner-border" role="status" v-show="showSpinner">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>
              <div id="preview-text" class="modal-body"></div>
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
            collection: null,
            recordId: null,
            showModal: false,
            record: null,
            showSpinner: false
        }
    },
    methods: {
        show: async function() {
            Jmarc.apiUrl = this.api_prefix
            if (this.collection && this.recordId) {
                this.showSpinner = true
                Jmarc.get(this.collection, this.recordId).then(jmarc => {
                    // The normal way to set things like this is to use a reactive data property
                    // But we can also just set the innerText to what we get here, which preserves
                    // the newline characters
                    let previewText = document.getElementById("preview-text")
                    previewText.innerText = jmarc.toStr()
                }).then( () => {this.showSpinner = false})
            } else {
                this.showModal = false
            }
            this.showModal = true
        }
    }
}