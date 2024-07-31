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
                <button type="button" class="btn btn-primary" @click="submitExport">Submit</button>
                <button type="button" class="btn btn-danger" @click="showModal = false">Cancel</button>
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
          let url = new URL(this.selectedExportUrl)
          let search = new URLSearchParams(url.search)
          search.set("start", 1)
          search.set("limit", 100)
          //search.set("listtype", "export")
          url.search = search
          this.selectedExportUrl = url
        },
        setOutputFields(e) {
            this.selectedFields = e.target.value
            let url = new URL(this.selectedExportUrl)
            let search = new URLSearchParams(url.search)
            search.set("fields", e.target.value)
            search.set("limit", 100)
            search.set("listtype", "export")
            url.search = search
            this.selectedExportUrl = url
        },
        async submitExport() {
            const url = new URL(this.selectedExportUrl);
            const params = new URLSearchParams(url.search);
            const format = params.get("format");
            let mimetype = null;
            let proceed = true;
            let buffer = format === 'xml' ? '<collection>' : ''; // semi hackish way to accumulate the xml
            // todo: handle buffer for more formats i.e. json, and improve xml handling

            while (proceed) {
                // cycle through pages synchronously
                const response = await fetch(this.selectedExportUrl);
                const blob = await response.blob();
                const text = await blob.text();
                mimetype = response.headers.get("Content-Type");

                if (mimetype.match('^text/xml')) {
                    const xml = (new DOMParser()).parseFromString(text, "text/xml")

                    if (xml.getElementsByTagName("record").length == 0) {
                        proceed = false
                    } else {
                        for (const recordXml of xml.getElementsByTagName("record")) {
                            // add the string serialization of the record node to the buffer
                            buffer += (new XMLSerializer()).serializeToString(recordXml) + '\n'
                        }
                    }
                } else if (text) {
                    buffer += text
                } else {
                    proceed = false
                }

                let newUrl = new URL(this.selectedExportUrl);
                let search = new URLSearchParams(newUrl.search);
                search.set("start", Number(search.get("start")) + Number(search.get("limit")));
                newUrl.search = search;
                this.selectedExportUrl = newUrl;
            }

            // see buffer declaration above
            if (format === 'xml') {
                buffer += '</collection>'
            }

            const blob = new File([buffer], {"type": mimetype});
            this.download(blob, `export.${this.selectedFormat}`);
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