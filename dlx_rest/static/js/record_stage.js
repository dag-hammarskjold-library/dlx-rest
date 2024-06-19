
export let multiplemarcrecordcomponent = {
    props: ["api_prefix"],
    template: `
    <div class="col-sm-10" id="app1" style="background-color:white;">
        <div>
            <div id="records" class="row">
                <div v-for="record in records">
                    
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
    methods: {

    }
}