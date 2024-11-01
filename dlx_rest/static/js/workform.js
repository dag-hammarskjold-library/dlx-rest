import { Jmarc } from "./jmarc.mjs"

export let workformcomponent = {
    props: ["api_prefix"],
    template: `
    <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
        <div class="row pt-2">
            <div class="col-2">Auth Workforms</div>
            <div class="col-10">
                <div v-for="w in auths_workforms" class="row">
                    <span class="mx-2" contenteditable="true">{{w.workformName}}</span>
                    <span class="mx-2" contenteditable="true">{{w.workformDescription}}</span>
                    <a :href="'/editor?workform=bibs/' + w.name"><i class="fas fa-edit"></i></a>
                </div>
                <div class="row"><a href="#">Create a new auth workform</a></div>
            </div>
        </div>
        <div class="row pt-2">
            <div class="col-2">Bib Workforms</div>
            <div class="col-10">
                <div v-for="w in bibs_workforms" class="row">
                    <span class="mx-2" contenteditable="true">{{w.name}}</span>
                    <span class="mx-2" contenteditable="true">{{w.description}}</span>
                    <a :href="'/editor?workform=bibs/' + w.name"><i class="fas fa-edit"></i></a>
                </div>
                <div class="row"><a href="#">Create a new bib workform</a></div>
            </div>
        </div>
    </div>
    `,
    data: function() {
        return {
            bibs_workforms: [],
            auths_workforms: [],
            file_workforms: []
        }
    },
    created: async function() {
        Jmarc.apiUrl = this.api_prefix;
        
        
        for (let col of ["auths", "bibs"]) {
            this[`${col}_workforms`] = await Jmarc.listWorkforms(col);
        }
    }
}