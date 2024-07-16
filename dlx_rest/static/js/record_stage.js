import { recordcomponent } from "./record.js"

export let multiplemarcrecordcomponent = {
    props: ["api_prefix"],
    template: `
    <div>
        <div class="d-flex flex-row">
            <div class="col-sm-2">
                <h1>Basket</h1>
            </div>
            <div class="col-sm">
                <div class="d-flex flex-row"></div>
                <div class="d-flex flex-row">{{message}}</div>
                <div class="d-flex flex-row">
                    <div v-for="(record, index) in records" v-bind:key="record">
                        <div :name="record" class="d-flex flex-column mx-1 record w-100" @click="selectRecord(e)">
                            <recordcomponent 
                                :collection="record.collection" 
                                :recordId="record.recordId" 
                                :api_prefix="api_prefix"
                                :editMode="true"
                                @close="closeRecord"
                                @inform="message => printMessage(message)"
                                @change="unsaved.push($event)" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data: function () {
        let route = new URL(window.location)
        let recordList = route.searchParams.get("records") ? route.searchParams.get("records").split(",") : []
        let recordObjects = []
        for (let record of recordList) {
            let collection = record.split("/")[0]
            let recordId = record.split("/")[1]
            recordObjects.push({"collection": collection, "recordId": recordId})
        }
        return {
            records: recordObjects,
            message: null,
            unsaved: []
        }
    },
    created: function () {
        console.log(this.records)
    },
    methods: {

    },
    components: {
        'recordcomponent': recordcomponent
    }
}