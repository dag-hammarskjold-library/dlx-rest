export let recordfilecomponent = {
    props: ["api_prefix", "record_id"],
    template: /* html */ `
    <div class="files-container">
        <span v-for="file in files" :key="file.language" class="file-language">
            <u><a :href="file.url + '?action=download'" target="_blank" :title="message" class="file-language">{{ langmap[file.language] }}</a></u>
        </span>
    </div>
    `,
    data: function () {
        return {
            message: "Download file or shift+click to open in a new browser tab",
            langmap: {en: 'E', ar: 'A', zh: 'C', fr: 'F', ru: 'R', es: 'S'},
            files: []
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