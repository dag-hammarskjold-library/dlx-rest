
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
            records: [{"collection":"bibs", "recordId":1373986}],
        }
    },
    methods: {

    },
    components: {
        'recordcomponent': recordcomponent
    }
}