export let searchHistoryComponent = {
    name: 'SearchHistory',
    props: {
        searchButtonId: {
            type: String,
            required: true
        },
        searchInputId: {
            type: String,
            required: true
        },
        userEmail: {
            type: String,
            required: true
        },
        apiPrefix: {
            type: String,
            required: true
        }
    },
    template: `
        <span class="d-inline-block">
            <button class="btn btn-success" @click.stop.prevent="toggleModal">
                Search History
            </button>

            <!-- Modal -->
            <div class="modal fade" :class="{ show: showModal }" tabindex="-1" :style="{ display: showModal ? 'block' : 'none' }">
                <div class="modal-dialog" style="width: 550px; max-width: 90%; margin: 2rem auto; position: relative; z-index: 1051; height: 600px;">
                    <div class="modal-content" style="border-radius: 0.3rem; box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15); background-color: #fff; height: 600px; max-height: 600px; display: flex; flex-direction: column; overflow: hidden;">
                        <div class="modal-header" style="border-bottom: 1px solid #dee2e6; padding: 0.5rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; height: 50px;">
                            <h5 class="modal-title">
                                Search History
                                <span class="badge bg-secondary rounded-pill ms-2">{{ history.length }}</span>
                            </h5>
                            <button type="button" class="btn-close" @click.stop.prevent="toggleModal"></button>
                        </div>
                        <div class="modal-body" style="padding: 0.5rem; overflow-y: auto; flex: 1; min-height: 0; max-height: calc(600px - 100px);">
                            <div class="list-group" style="padding: 0.5rem;">
                                <div v-if="history.length > 0" style="padding: 0.15rem 0.75rem; margin-bottom: 0.5rem;">
                                    <small class="text-muted" style="font-size: 0.9rem; font-weight: bold;">Click on the entry to display the term in the search input</small>
                                </div>
                                <div v-for="item in history" :key="item.id" class="list-group-item d-flex justify-content-between align-items-center" style="padding: 0.35rem 0.5rem; border: 1px solid #dee2e6; border-radius: 0.25rem; background-color: #f8f9fa; margin-bottom: 0.35rem; cursor: pointer;" @click="handleEntryClick(item.term)">
                                    <div style="flex: 1; min-width: 0;">
                                        <div class="term" style="font-weight: 500; margin-bottom: 0.15rem; word-break: break-word; font-size: 0.95rem;">{{ item.term }}</div>
                                        <small style="font-size: 0.85rem; color: #0d6efd; font-weight: bold;">{{ formatDate(item.datetime) }}</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-secondary" @click.stop.prevent="deleteItem(item.id)" style="padding: 0.15rem 0.35rem; margin-left: 0.35rem; flex-shrink: 0;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                                <div v-if="history.length === 0" class="list-group-item text-muted" style="padding: 0.75rem 1rem; border: 1px solid #dee2e6; border-radius: 0.25rem; background-color: #f8f9fa;">
                                    No search history
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer" style="border-top: 1px solid #dee2e6; padding: 0.5rem 1rem; display: flex; justify-content: flex-end; flex-shrink: 0; height: 50px;">
                            <button class="btn btn-outline-danger" @click.stop.prevent="clearHistory" style="padding: 0.375rem 0.75rem; font-size: 0.9rem;">
                                Clear All
                            </button>
                            <button type="button" class="btn btn-secondary" @click.stop.prevent="toggleModal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="showModal" class="modal-backdrop fade show" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 1040;"></div>
        </span>
    `,
    data() {
        return {
            history: [],
            showModal: false
        }
    },
    mounted() {
        console.log('Search history component mounted');
        this.loadHistory();
        // Add click event listener to close modal when clicking outside
        document.addEventListener('click', this.handleOutsideClick);
    },
    beforeDestroy() {
        // Clean up event listener
        document.removeEventListener('click', this.handleOutsideClick);
    },
    methods: {
        toggleModal() {
            this.showModal = !this.showModal;
        },
        handleOutsideClick(event) {
            // Close modal if clicking outside
            if (this.showModal && !event.target.closest('.modal-content') && !event.target.closest('.btn-outline-secondary')) {
                this.showModal = false;
            }
        },
        async loadHistory() {
            try {
                const response = await fetch(`${this.apiPrefix}search-history`);
                if (response.ok) {
                    this.history = await response.json();
                }
            } catch (error) {
                console.error('Error loading search history:', error);
            }
        },
        async addToHistory(term) {
            try {
                const response = await fetch(`${this.apiPrefix}search-history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ term })
                });
                if (response.ok) {
                    await this.loadHistory();
                }
            } catch (error) {
                console.error('Error adding to search history:', error);
            }
        },
        async deleteItem(id) {
            try {
                const confirmed = confirm('Are you sure you want to delete this search history entry?');
                if (!confirmed) {
                    return;
                }
                const response = await fetch(`${this.apiPrefix}search-history/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    await this.loadHistory();
                }
            } catch (error) {
                console.error('Error deleting search history item:', error);
            }
        },
        async clearHistory() {
            try {
                const response = await fetch(`${this.apiPrefix}search-history`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    this.history = [];
                }
            } catch (error) {
                console.error('Error clearing search history:', error);
            }
        },
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString();
        },
        handleEntryClick(term) {
            // Set the search input value
            const searchInput = document.getElementById(this.searchInputId);
            if (searchInput) {
                searchInput.value = term;
                // Trigger input event to ensure any listeners are notified
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // Close the modal
            this.showModal = false;
        }
    }
} 