import { Jmarc } from "../jmarc.mjs"

export let selectworkform = {
    props: ["api_prefix", "collection"],
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
                        <td><a :href="uibase + '/editor?workform=' + collection + '/' + w.name"  target="_blank"><i class="fas fa-edit" role="button" title="Send to editor"></i></a></td>
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
        let uibase = this.api_prefix.replace("/api/","")
        return {
            uibase: uibase,
            workforms: []
        }
    },
    created: async function() {
        await Jmarc.listWorkforms(this.collection).then(workforms => {
            this.workforms = workforms;
        })
    }
}