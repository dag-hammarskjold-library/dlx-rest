import { CSV } from "../utils/csv.mjs"

export let exportmodal = {
  props: {
    api_prefix: {
      type: String,
      required: true
    },
    collection: {
      type: String,
      required: true
    },
    searchTerm: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      showSpinner: false,
      selectedFormat: 'mrk',
      selectedFields: '',
      currentStatus: null,
      cancelled: false,
      abortController: null,
      exportFormats: [
        { id: 'mrk', label: 'MRK', mimeType: 'text/plain' },
        { id: 'xml', label: 'XML', mimeType: 'text/xml' },
        { id: 'csv', label: 'CSV', mimeType: 'text/csv' }
      ]
    }
  },

  computed: {
    searchUrl() {
      return `${this.api_prefix}marc/${this.collection}/records?search=${encodeURIComponent(this.searchTerm)}`
    },
    exportUrl() {
      return this.searchUrl + `&format=${this.selectedFormat}`
    },
    isExporting() {
      return this.showSpinner
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
              <div class="form-check" v-for="format in exportFormats" :key="format.id">
                <input class="form-check-input" type="radio" 
                       :id="'format' + format.label"
                       :value="format.id"
                       v-model="selectedFormat">
                <label class="form-check-label" :for="'format' + format.label">
                  {{format.label}}
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>Output Fields:</label>
              <input type="text" class="form-control" 
                     placeholder="comma separated list of fields (tags only)"
                     v-model="selectedFields">
            </div>
          </div>
          <div class="modal-footer">
            <div class="d-flex justify-content-between align-items-center w-100">
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
                        :disabled="isExporting">Export</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  methods: {
    show() {
      $(this.$el).modal('show')
    },

    hide() {
      this.cancelled = true
      this.abortController.abort()
      $(this.$el).modal('hide')
      this.reset()
    },

    reset() {
      this.selectedFormat = 'mrk'
      this.selectedFields = ''
      this.showSpinner = false
      this.currentStatus = null
    },

    async submitExport() {
      this.cancelled = false
      this.showSpinner = true
      this.currentStatus = null
      this.abortController = new AbortController()
      this.abortSignal = this.abortController.signal

      try {
        const limit = 100 // 100 records per page call
        let start = 1
        const format = this.exportFormats.find(f => f.id === this.selectedFormat)
        let mimeType = format.mimeType
        
        // Set a buffer to a xml object, csv object, or string depending on requested format
        let buffer = format.id === 'xml' ? 
          (new DOMParser()).parseFromString("<collection></collection>", "text/xml") : 
          (format.id === 'csv' ? 
            new CSV() : 
            ""
          )
        
        // get the total and search ID
        const initialResponse = await fetch(this.searchUrl)
        if (!initialResponse.ok) throw new Error(`Search failed: ${initialResponse.statusText}`)
        const json = await initialResponse.json()
        const total = json['_meta']['count']
        const searchId = (new URLSearchParams(json['_links']['_next'])).get('search_id')

        let exportUrl = new URL(this.exportUrl + `&search_id=${searchId}`)
        
        if (this.selectedFields) {
          exportUrl.searchParams.set('fields', this.selectedFields)
        }

        while (start <= total) {
          exportUrl.searchParams.set('start', start)
          exportUrl.searchParams.set('limit', limit)
          const response = await fetch(exportUrl.toString(), {signal: this.abortSignal})
          if (!response.ok) throw new Error(`Export failed: ${response.statusText}`)
          if (this.cancelled) {
            // Currently this will never happen, because the fetch request will be aborted, throwing an error.
            // If we decide to catch the error and handle it differently, the loop will need to break here.
            break
          }
          const text = await response.text()

          // Add to the buffer 
          switch (format.id) {
            case 'mrk':
              buffer += text + "\n"
              break
            case 'xml':
              const pageXml = (new DOMParser()).parseFromString(text, "text/xml")
              const recordNodes = pageXml.getElementsByTagName("record")  
              for (const recordXml of [...recordNodes]) { // have to use the "..." operator on the node list to treat it as an array
                buffer.getElementsByTagName("collection")[0].appendChild(recordXml);
              }
              break
            case 'csv':
              buffer.parseText(text);
          }

          start += limit
          const progress = Math.min(((start - 1) / total * 100).toFixed(1), 100)
          this.currentStatus = `${progress}% of ${total} records`
        }

        // Convert buffer object to string
        buffer = format.id === 'xml' ?
          (new XMLSerializer()).serializeToString(buffer) :
          (format.id === 'csv' ?
            buffer.toString() :
            buffer
          )

        this.download(new Blob([buffer], { type: mimeType }), `export.${format.id}`, mimeType)
        this.currentStatus = 'Export complete!'

      } catch (error) {
        console.error('Export error:', error)
        this.currentStatus = 'Export failed'
      } finally {
        this.showSpinner = false
      }
    },
    download(blob, filename, mimeType) {
      const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  }
}
