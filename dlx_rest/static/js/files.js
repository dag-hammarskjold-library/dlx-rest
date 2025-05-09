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
                        @dragover="handleDragOver"
                        @dragleave="handleDragLeave"
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

            <!-- File Edit Form Section -->
            <div class="row mt-4" v-if="files.length > 0">
                <div class="col">
                    <h4>Edit Files Before Upload</h4>
                    <div v-for="(file, index) in files" :key="index" class="card mb-3">
                        <div class="card-body">
                            <div class="form-group">
                                <label>Filename</label>
                                <input type="text" class="form-control" v-model="file.filename">
                            </div>
                            
                            <!-- Identifiers -->
                            <div class="form-group mt-3">
                                <label>Identifiers</label>
                                <div v-for="(value, type) in file.identifiers" :key="type" class="input-group mb-2">
                                    <input type="text" class="form-control" v-model="file.identifiers[type]" :placeholder="type">
                                    <button class="btn btn-danger" @click="removeIdentifier(file, type)">Remove</button>
                                </div>
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="newIdentifierType" placeholder="Type">
                                    <input type="text" class="form-control" v-model="newIdentifierValue" placeholder="Value">
                                    <button class="btn btn-primary" @click="addIdentifier(file)">Add Identifier</button>
                                </div>
                            </div>

                            <!-- Languages -->
                            <div class="form-group mt-3">
                                <label>Languages</label>
                                <div v-for="(lang, index) in file.languages" :key="index" class="input-group mb-2">
                                    <input type="text" class="form-control" v-model="file.languages[index]">
                                    <button class="btn btn-danger" @click="removeLanguage(file, index)">Remove</button>
                                </div>
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="newLanguage" placeholder="Language code">
                                    <button class="btn btn-primary" @click="addLanguage(file)">Add Language</button>
                                </div>
                            </div>

                            <button class="btn btn-primary mt-3" @click="uploadFile(file)">Upload</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    style: /* css */ `
        .drop-zone {
            transition: all 0.3s ease;
            border: 2px dashed #dee2e6;
        }
        
        .drop-zone.border-primary {
            border: 2px dashed #007bff;
            background-color: rgba(0, 123, 255, 0.1);
        }
    `,
    data: function () {
        return {
            step: "init",
            searchQuery: "",
            identifierType: "symbol", // Default value
            results: null,
            files: [],
            newIdentifierType: '',
            newIdentifierValue: '',
            newLanguage: ''
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
                const url = new URL(window.location.href)
                url.searchParams.set('identifier_type', this.identifierType)
                url.searchParams.set('identifier', this.searchQuery)
                window.history.pushState({}, '', url)
                
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
        handleDragOver: function (event) {
            event.preventDefault();
            event.currentTarget.classList.add('border-primary');
        },
        
        handleDragLeave: function (event) {
            event.preventDefault();
            event.currentTarget.classList.remove('border-primary');
        },
        handleDrop: async function (event) {
            event.preventDefault();
    
            // Get the dropped files
            const droppedFiles = event.dataTransfer.files;
            
            // Add visual feedback for drop zone
            const dropZone = event.currentTarget;
            dropZone.classList.remove('border-primary');
            
            if (droppedFiles.length > 0) {
                // Process the files using the same handler as file select
                this.handleFileSelect({
                    target: {
                        files: droppedFiles
                    }
                });
            }
        },
        handleFileSelect: async function (event) {
            const files = event.target.files;
            if (!files.length) return;

            this.files = Array.from(files).map(file => {
                // Try to parse symbol from filename
                const symbolMatch = file.name.match(/^([A-Z])_(\d{4})_(\d+)(?:-([A-Z]{2}))?\.(.+)$/);
                
                let fileData = {
                    file: file,
                    originalName: file.name,
                    editing: true,
                    filename: file.name,
                    identifiers: {},
                    languages: []
                };

                if (symbolMatch) {
                    const [_, type, year, number, lang, ext] = symbolMatch;
                    const symbol = `${type}/${year}/${number}`;
                    fileData.identifiers.symbol = symbol;
                    
                    if (lang) {
                        fileData.languages.push(lang.toLowerCase());
                    }
                }

                return fileData;
            });
        },

        // File upload supporting methods
        removeIdentifier(file, type) {
            Vue.delete(file.identifiers, type);
        },

        addIdentifier(file) {
            if (this.newIdentifierType && this.newIdentifierValue) {
                Vue.set(file.identifiers, this.newIdentifierType, this.newIdentifierValue);
                this.newIdentifierType = '';
                this.newIdentifierValue = '';
            }
        },

        addLanguage(file) {
            if (this.newLanguage) {
                file.languages.push(this.newLanguage.toLowerCase());
                this.newLanguage = '';
            }
        },

        // Add uploadFile method
        async uploadFile(fileData) {
            // Create FormData object
            const formData = new FormData();
            formData.append('file', fileData.file);
            
            // Add required identifier from the identifiers object
            // Prioritize symbol, then isbn, then uri
            let identifierType = null;
            let identifierValue = null;
            
            if ('symbol' in fileData.identifiers) {
                identifierType = 'symbol';
                identifierValue = fileData.identifiers.symbol;
            } else if ('isbn' in fileData.identifiers) {
                identifierType = 'isbn';
                identifierValue = fileData.identifiers.isbn;
            } else if ('uri' in fileData.identifiers) {
                identifierType = 'uri';
                identifierValue = fileData.identifiers.uri;
            }
        
            if (!identifierType || !identifierValue) {
                throw new Error('At least one identifier (symbol, isbn, or uri) is required');
            }
        
            formData.append('identifier_type', identifierType);
            formData.append('identifier', identifierValue);
        
            // Add languages as comma-separated list
            if (!fileData.languages.length) {
                throw new Error('At least one language is required');
            }
            formData.append('languages', fileData.languages.join(','));
        
            try {
                const response = await fetch(`${this.api_prefix}files`, {
                    method: 'POST',
                    body: formData
                });
        
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Upload failed');
                }
        
                // Remove file from editing list after successful upload
                this.files = this.files.filter(f => f !== fileData);
                
                // Refresh search results if we have a search query
                if (this.searchQuery) {
                    await this.searchFiles();
                }
        
                return await response.json();
            } catch (error) {
                console.error('Upload failed:', error);
                throw error;
            }
        }
    }
}