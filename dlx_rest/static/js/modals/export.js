import { Jmarc } from "../jmarc.mjs"
import { CSV } from "../csv.mjs"

export let exportmodal = {
  props: {
    links: {
      type: Object,
      required: true
    }
  },
  template: `
  <div class="modal fade" ref="modal" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Export Results</h5>
            <button type="button" class="close" @click="hide">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select format:</label>
              <div class="form-check">
                <input class="form-check-input" type="radio" 
                       id="formatMrk" value="mrk" 
                       v-model="selectedFormat">
                <label class="form-check-label" for="formatMrk">MRK</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" 
                       id="formatXml" value="xml" 
                       v-model="selectedFormat">
                <label class="form-check-label" for="formatXml">XML</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" 
                       id="formatCsv" value="csv" 
                       v-model="selectedFormat">
                <label class="form-check-label" for="formatCsv">CSV</label>
              </div>
            </div>
            <div class="form-group">
              <label>Output Fields:</label>
              <input type="text" class="form-control" 
                     placeholder="comma separated list of fields (tags only)"
                     v-model="selectedFields">
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <div class="spinner-border mr-2" v-show="showSpinner">
                <span class="sr-only">Loading...</span>
              </div>
              <span v-if="currentStatus">{{ currentStatus }}</span>
            </div>
            <div>
              <button type="button" class="btn btn-secondary mr-2" @click="hide">Close</button>
              <button type="button" class="btn btn-primary" 
                      @click="submitExport" 
                      :disabled="showSpinner">Export</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data: function () {
    return {
      showSpinner: false,
      selectedFormat: 'mrk',
      selectedFields: '',
      selectedExportUrl: '',
      currentStatus: null
    }
  },
  mounted: function () {
    console.log(this.selectedFormat)
    this.setFormat(this.selectedFormat)
  },
  methods: {
    show() {
      $(this.$el).modal('show')
    },

    hide() {
      $(this.$el).modal('hide')
      this.reset()
    },

    reset() {
      this.selectedFormat = 'mrk'
      this.selectedFields = ''
      this.showSpinner = false
      this.currentStatus = null
    },
    setFormat(format) {
      this.selectedFormat = format;
      
      // Get the URL directly from this.links
      console.log(this.links)
      console.log(this.links.format)
      this.selectedExportUrl = this.links.format[format.toUpperCase()];
      
      if (!this.selectedExportUrl) {
        console.warn(`No URL found for format ${format.toUpperCase()}`);
        return;
      }

      try {
        let url = new URL(this.selectedExportUrl);
        let search = new URLSearchParams(url.search);
        search.set("fields", this.selectedFields);
        search.set("start", 1);
        search.set("limit", 100);
        url.search = search;
        this.selectedExportUrl = url;
        console.log('Export URL set to:', this.selectedExportUrl);
      } catch (error) {
        console.error('Error setting export URL:', error);
      }
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
      this.currentStatus = null;
      this.showSpinner = true;
      const url = new URL(this.selectedExportUrl);
      const params = new URLSearchParams(url.search);
      const format = params.get("format");
      const countUrl = this.selectedExportUrl.toString().replace('/records', '/records/count');
      const total = await fetch(countUrl).then(response => response.json()).then(json => json['data']);
      let currentUrl = this.selectedExportUrl;
      let page = 0;
      let mimetype = null;
      let buffer = '';
      let xml = format === 'xml' ?
        // XMLDocument object will be used to combine xml from each page
        (new DOMParser()).parseFromString("<collection></collection>", "text/xml") :
        null;
      let csv = new CSV();

      while (true) {
        // cycle through pages synchronously until no more records are found
        const response = await fetch(currentUrl);
        const blob = await response.blob();
        let text = await blob.text();

        mimetype = response.headers.get("Content-Type");

        if (text) {
          if (mimetype.match('^text/xml')) {
            const pageXml = (new DOMParser()).parseFromString(text, "text/xml")
            const recordNodes = pageXml.getElementsByTagName("record")
            
            if (recordNodes.length === 0) {
              break
            }

            for (const recordXml of [...recordNodes]) { // have to use the "..." operator on the node list to treat it as an array
              xml.getElementsByTagName("collection")[0].appendChild(recordXml);
            }
          } else if (format === 'csv') {
            csv.parseText(text);
          } else {
            // mrk is plain text
            buffer += text + "\n"
          }
        } else {
          // end of results
          break
        }

        if (format === 'xml') {
          buffer = (new XMLSerializer()).serializeToString(xml);
        } else if (format === 'csv') {
          buffer = csv.toString();
        }

        // next page
        let newUrl = new URL(currentUrl);
        let params = new URLSearchParams(newUrl.search);
        params.set("start", Number(params.get("start")) + Number(params.get("limit")));
        newUrl.search = params;
        currentUrl = newUrl;

        // status
        page++;
        const results = page * 100;
        let percent = (results / total) * 100;
        percent = percent > 100 ? 100 : percent.toFixed(2);
        this.currentStatus = `${percent}% of ${total} records`;
      }

      const blob = new File([format === 'xml' ? (new XMLSerializer()).serializeToString(xml) : buffer], { "type": mimetype });
      this.download(blob, `export.${this.selectedFormat}`);
      this.showSpinner = false;
      this.currentStatus = "Done!"
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
    },
  }
}