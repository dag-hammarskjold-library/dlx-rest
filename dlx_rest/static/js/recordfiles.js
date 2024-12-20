export let recordfilecomponent = {
    props: ["api_prefix", "record_id"],
    template: `<ul v-if="files" class="list-group list-group-horizontal list-group-flush m-0 p-0 pb-1">
        <li v-for="file in files" class="list-group-item border-0 m-0 p-0 mr-1 float-left">
            <ul class="list-group list-group-horizontal list-group-flush m-0 p-0 pb-1">
                <li class="list-group-item list-group-item-dark border-0 m-0 p-0 px-1">
                    {{file.language}} 
                </li>
                <li class="list-group-item list-group-item-dark border-0 m-0 p-0 px-1">
                    <a :href="file.url + '?action=open'" target="_blank" title="open"><i class="fas fa-file text-dark"></i></a>
                </li>                
                <li class="list-group-item list-group-item-dark border-0 m-0 p-0 px-1">
                    <a :href="file.url + '?action=download'" target="_blank" title="open"><i class="fas fa-cloud-download-alt text-dark"></i></a>
                </li>
                
            </ul>
        </li>
    </ul>`,
    data: function () {
        return {
            files: null
        }
    },
    created: async function() {
        let url = `${this.api_prefix}marc/bibs/records/${this.record_id}/files`;
        fetch(url).then(
            response => response.json()
        ).then(
            json => {
                this.files = json.data
            }
        )
    }
}