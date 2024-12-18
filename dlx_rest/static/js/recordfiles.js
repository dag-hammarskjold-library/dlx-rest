export let recordfilecomponent = {
    props: ["api_prefix", "record_id"],
    template: `<div class="row" v-if="file">
        <ul class="list-group list-group-horizontal list-group-flush m-0 p-0 pb-1">
            <li class="list-group-item list-group-item-dark border-0 m-0 p-0 px-1">
                en 
            </li>
            <li class="list-group-item list-group-item-dark border-0 m-0 p-0 px-1">
                <a :href="file" target="_blank" title="open"><i class="fas fa-file text-dark"></i></a>
            </li>
        </ul>
    </div>`,
    data: function () {
        return {
            file: null
        }
    },
    created: async function() {
        let url = `${this.api_prefix}marc/bibs/records/${this.record_id}/files`;
        fetch(url).then(
            response => response.json()
        ).then(
            json => {
                let enFile = json.data.filter((x) => x.language == 'en')
                if (enFile.length == 1) {
                    this.file = enFile[0].url + "?action=open"
                }
            }
        )
    }
}