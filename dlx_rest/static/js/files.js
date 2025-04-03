export let filescomponent = {
    props: ["api_prefix"],
    template: /* html */ `
        <div class="container">
            <!-- Search Section -->
            <div class="row mb-4">
                <div class="col">
                    <div class="input-group">
                        <select class="form-select" style="max-width: 120px;" v-model="identifierType">
                            <option value="symbol">Symbol</option>
                            <option value="isbn">ISBN</option>
                            <option value="uri">URI</option>
                        </select>
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
            identifierType: "symbol", // Default value
            results: null,
            files: []
        }
    },
    created: async function () {
        if (this.from_identifiers) {
            this.searchQuery = this.from_identifiers.join(' ');
            await this.searchFiles();
        }
    },
    methods: {
        searchFiles: async function () {
            if (!this.searchQuery) {
                // If no search query, don't perform search
                this.results = [];
                return;
            }

            try {
                // Construct URL with query parameters
                const searchParams = new URLSearchParams({
                    identifier_type: this.identifierType,
                    identifier: this.searchQuery
                });
                
                const response = await fetch(`${this.api_prefix}/files?${searchParams}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data && data.data) {
                    // Process each file URL to get the full file details
                    const filePromises = data.data.map(async (fileUrl) => {
                        const fileResponse = await fetch(fileUrl);
                        if (!fileResponse.ok) {
                            console.error(`Failed to fetch file details for ${fileUrl}`);
                            return null;
                        }
                        return fileResponse.json();
                    });
                    
                    // Wait for all file details to be fetched
                    const fileDetails = await Promise.all(filePromises);
                    
                    // Filter out any failed requests and extract file data
                    this.results = fileDetails
                        .filter(file => file && file.data)
                        .map(file => ({
                            id: file.data._id,
                            name: file.data.filename,
                            url: `${this.api_prefix}files/${file.data._id}?action=open`,
                            type: file.data.mimetype,
                            languages: file.data.languages || [],
                            identifiers: file.data.identifiers || {}
                        }));
                } else {
                    this.results = [];
                }
            } catch (error) {
                console.error('Error searching files:', error);
                this.results = [];
                // Add error handling UI feedback here
            }
        },
        handleFileSelect: async function () {
            return
        }
    }
}