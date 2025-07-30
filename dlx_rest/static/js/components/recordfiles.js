import { Jmarc } from "../api/jmarc.mjs"

export let recordfilecomponent = {
    props: {
        record_data: {
            // This is a record in "brief" format. It now includes files data 
            type: Object,
            required: true
        },
        desired_languages: {
            type: Array,
            required: false,
            default: () => ['AR', 'ZH', 'EN', 'FR', 'RU', 'ES']
        }
    },
    template: /* html */ `
    <div class="files-container">
        <span v-for="file in files" :key="file.language" class="file-language">
            <u><a :href="file.url + '?action=open'" target="_blank" :title="message" class="file-language">{{ langmap[file.language] }}</a></u>
        </span>
    </div>
    `,
    data: function () {
        return {
            message: "Download file or shift+click to open in a new browser tab",
            langmap: {EN: 'E', AR: 'A', ZH: 'C', FR: 'F', RU: 'R', ES: 'S'},
            files: []
        }
    },
    created: async function() {
        this.files = this.record_data["files"].filter(x => this.desired_languages.includes(x.language))
    }
}