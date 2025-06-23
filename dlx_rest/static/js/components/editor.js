import { basketcomponent } from "./basket.js";
import { headercomponent } from "./header.js";
import { recordcomponent } from "./record.js";
import { EventBus } from "../utils/event-bus.js";

export let editorcomponent = {
    name: "editorcomponent",
    props: ["api_prefix"],
    components: { 
        basketcomponent, 
        headercomponent,
        recordcomponent
    },
    template: `
    <div class="container-fluid" id="editor-app">
        <div class="row">
          <!-- Basket in left column -->
          <div class="col-md-3 col-lg-2 pr-0" style="min-width:260px;max-width:350px;">
            <basketcomponent
              :api_prefix="api_prefix"
              style="height: 100vh; overflow-y: truncate;"
            ></basketcomponent>
          </div>
          <!-- Record editor(s) in right column -->
          <div class="col-md-9 ml-3" style="background:#fff;">
            <div class="row" id="records">
              <recordcomponent
                v-for="rec in displayedRecords"
                :key="rec.collection + '-' + rec.recordId"
                :api_prefix="api_prefix"
                :_id="rec.recordId"
                :collection="rec.collection"
                class="col-sm-6 mt-1 pb-2 pl-0 div_editor"
                style="overflow-y: scroll; min-height:650px; position: relative"
              ></recordcomponent>
            </div>
            <!-- Modals and overlays go here -->
            <slot></slot>
          </div>
        </div>
      </div>
    `,
    data() {
        return {
            displayedRecords: []
        };
    },
    created() {
        // Listen for open-record and remove-record events
        EventBus.$on('open-record', this.openRecord);
        EventBus.$on('remove-record', this.removeRecord);

        // On load, open records from URL if present
        this.openRecordsFromUrl();
    },
    watch: {
        displayedRecords: {
            handler() {
                this.updateUrlWithRecords();
            },
            deep: true
        }
    },
    methods: {
        openRecord({ collection, record_id }) {
            // Prevent duplicates, allow up to 2 records
            const exists = this.displayedRecords.some(
                rec => rec.collection === collection && String(rec.recordId) === String(record_id)
            );
            if (!exists) {
                if (this.displayedRecords.length >= 2) {
                    // Remove the oldest (first) record if already 2 open
                    this.displayedRecords.shift();
                }
                this.displayedRecords.push({ collection, recordId: record_id });
            }
        },
        removeRecord({ collection, record_id }) {
            this.displayedRecords = this.displayedRecords.filter(
                rec => !(rec.collection === collection && String(rec.recordId) === String(record_id))
            );
        },
        updateUrlWithRecords() {
            // Format: records=collection/id,collection/id
            const params = new URLSearchParams(window.location.search);
            if (this.displayedRecords.length > 0) {
                const recordsParam = this.displayedRecords
                    .map(rec => `${rec.collection}/${rec.recordId}`)
                    .join(",");
                params.set("records", recordsParam);
            } else {
                params.delete("records");
            }
            const newUrl =
                window.location.pathname +
                (params.toString() ? "?" + params.toString() : "");
            window.history.replaceState({}, "", newUrl);
        },
        async openRecordsFromUrl() {
            const params = new URLSearchParams(window.location.search);
            const recordsParam = params.get("records");
            if (recordsParam) {
                const pairs = recordsParam.split(",").slice(0, 2); // Only allow up to 2
                for (const pair of pairs) {
                    const [collection, id] = pair.split("/");
                    if (collection && id) {
                        // Try to fetch the record to check if it exists
                        try {
                            // Use a minimal fetch to check existence
                            const resp = await fetch(
                                `${this.api_prefix}marc/${collection}/records/${id}`
                            );
                            if (!resp.ok) throw new Error();
                            // If found, open it
                            this.openRecord({ collection, record_id: id });
                        } catch {
                            alert(
                                `Record not found: ${collection}/${id}`
                            );
                        }
                    }
                }
            }
        }
    }
}