
import { recordcomponent } from "./record.js"

export let multiplemarcrecordcomponent = {
    props: ["api_prefix"],
    template: `
    <div class="col-sm-10" id="app1" style="background-color:white;">
        <div>
            <div id="records" class="row">
                <div v-for="record in records">
                    <recordcomponent :api_prefix="api_prefix" :collection="record.collection" :recordId="record.recordId"></recordcomponent>
                </div>
            </div>
        </div>
    </div>
    `,
    data: function () {
        return {
            records: [],
        }
    },
    created: function () {
        //console.log(this.records)
        //console.log(this.api_prefix)
        var url = new URL(window.location)
        var recordsList = url.searchParams.get("records")
        for (let r of recordsList.split(",")) {
            let coll = r.split("/")[0]
            let rid = r.split("/")[1]
            this.records.push({"collection": coll, "recordId": rid})
        }
    },
    methods: {

    },
    components: {
        'recordcomponent': recordcomponent
    }
}