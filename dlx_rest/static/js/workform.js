import workform from "./api/workform_api.js"

export let workformcomponent = {
    props: ["api_prefix"],
    template: `
    <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
        <div class="row pt-2">
            <div class="col-2">Auth Workforms</div>
            <div class="col-10">
                <div v-for="w in auth_workforms" class="row">
                    <a :href="'/editor?workform=auths/' + w.data.name">{{w.data.name}}</a>
                </div>
            </div>
        </div>
        <div class="row pt-2">
            <div class="col-2">Bib Workforms</div>
            <div class="col-10">
                <div v-for="w in bib_workforms" class="row">
                    <a :href="'/editor?workform=bibs/' + w.data.name">{{w.data.name}}</a>
                </div>
            </div>
        </div>
    </div>
    `,
    data: function() {
        return {
            bib_workforms: [],
            auth_workforms: [],
            file_workforms: []
        }
    },
    created: async function() {
        let bib_workforms = await workform.listWorkforms(this.api_prefix, 'bibs');
        this.bib_workforms = bib_workforms;
        let auth_workforms = await workform.listWorkforms(this.api_prefix, 'auths');
        this.auth_workforms = auth_workforms;
    }
}