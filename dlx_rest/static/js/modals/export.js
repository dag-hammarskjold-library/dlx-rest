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
      exportFormats: [
        { id: 'mrk', label: 'MRK', mimeType: 'text/plain' },
        { id: 'xml', label: 'XML', mimeType: 'text/xml' },
        { id: 'csv', label: 'CSV', mimeType: 'text/csv' }
      ]
    }
  },

  computed: {
    exportUrl() {
      return `${this.api_prefix}marc/${this.collection}/records?search=${encodeURIComponent(this.searchTerm)}&format=${this.selectedFormat}`
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
      this.showSpinner = true
      this.currentStatus = null

      try {
        const url = new URL(this.exportUrl)
        if (this.selectedFields) {
          url.searchParams.set('fields', this.selectedFields)
        }

        const format = this.exportFormats.find(f => f.id === this.selectedFormat)
        const response = await this.fetchExportData(url)
        
        if (!response.ok) {
          throw new Error(`Export failed: ${response.statusText}`)
        }

        const blob = await response.blob()
        this.download(blob, `export.${format.id}`, format.mimeType)
        this.currentStatus = 'Export complete!'

      } catch (error) {
        console.error('Export error:', error)
        this.currentStatus = 'Export failed'
      } finally {
        this.showSpinner = false
      }
    },

    async fetchExportData(url) {
      const response = await fetch(url.toString())
      const total = await this.getRecordCount()
      let processed = 0

      while (processed < total) {
        processed += 100 // Assuming 100 records per page
        const progress = Math.min((processed / total * 100).toFixed(1), 100)
        this.currentStatus = `${progress}% of ${total} records`
      }

      return response
    },

    async getRecordCount() {
      const countUrl = this.exportUrl.replace('/records', '/records/count')
      const response = await fetch(countUrl)
      const data = await response.json()
      return data.data
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