export let filescomponent = {
    props: [
        {
            api_prefix: {
                type: String,
                required: true
            },
            from_identifiers: {
                type: Array,
                required: false
            }
        }
    ],
    template: /* html */ `
        <div class="container">
            <!-- Search Section -->
            <div class="row mb-4">
                <div class="col">
                    <div class="input-group">
                        <input type="text" class="form-control" v-model="searchQuery" 
                            placeholder="Search files by identifier..." 
                            @keyup.enter="searchFiles">
                        <button class="btn btn-primary" @click="searchFiles">
                            Search
                        </button>
                    </div>
                </div>
            </div>

            <!-- Results Section -->
            <div class="row mb-4" v-if="results && results.length">
                <div class="col">
                    <h4>Search Results</h4>
                    <div class="list-group">
                        <div v-for="file in results" :key="file.id" class="list-group-item">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 class="mb-1">
                                        <a :href="file.url" target="_blank">{{file.name}}</a>
                                    </h5>
                                    <p class="mb-1">
                                        <span class="badge bg-secondary me-2">{{file.type}}</span>
                                        <span v-for="lang in file.languages" 
                                            :key="lang" 
                                            class="badge bg-info me-2">{{lang}}</span>
                                    </p>
                                    <div class="small">
                                        <div v-for="(value, type) in file.identifiers" 
                                            :key="type" 
                                            class="badge bg-light text-dark me-2">
                                            {{type}}: {{value}}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- File Upload Section -->
            <div class="row">
                <div class="col">
                    <div class="drop-zone p-5 border rounded text-center"
                        @dragover.prevent
                        @drop.prevent="handleDrop">
                        <div class="mb-3">
                            <i class="fas fa-cloud-upload-alt fa-3x"></i>
                        </div>
                        <p class="mb-0">
                            Drag and drop files here or
                            <label class="text-primary" style="cursor: pointer;">
                                <input type="file" 
                                    multiple 
                                    style="display: none;" 
                                    @change="handleFileSelect">
                                browse
                            </label>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `,
    data: function () {
        return {
            step: "init",
            searchQuery: "",
            results: null,
            files: []
        }
    },
    created: async function () {
        if (this.from_identifiers) {
            this.searchQuery = this.from_identifiers.join(' ');
            await this.searchFiles();
        }
    }
}