import { Jmarc } from "../jmarc.mjs"

export let selectworkform = {
    props: ["collection"],
    template: `
    <div class="modal fade" :id="'select-' + collection + '-WorkformModal'" tabindex="-1" role="dialog" aria-labelledby="selectWorkformModalTitle" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLongTitle">Select {{collection}} workform</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <table class="table table-hover">
                    <tr class="border-0" v-for="w in workforms">
                        <td>{{w.name}}</td>
                        <td>{{w.description}}</td>
                        <td><a :href="'/editor?workform=' + collection + '/' + w.name"><i class="fas fa-edit" role="button" title="Send to editor"></i></a></td>
                    </tr>
                </table>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
            </div>
        </div>
    </div>`,
    data: function() {
        return {
            workforms: []
        }
    },
    created: async function() {
        let workforms = await Jmarc.listWorkforms(this.collection);
        this.workforms = workforms;
    }
}



/*
        <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
            <div class="row pt-2">
                <div class="col-2">{{collection}} Workforms</div>
                <div class="col-10">
                    <div v-for="w in workforms" class="row">
                        <span class="mx-2">{{w.name}}</span>
                        <span class="mx-2">{{w.description}}</span>
                        <i class="fas fa-check-square"></i>
                    </div>
                </div>
            </div>
        </div>
*/