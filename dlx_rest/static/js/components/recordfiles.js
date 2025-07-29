export let recordfilecomponent = {
    props: {
        api_prefix: {
            type: String,
            required: false
        },
        record_id: {
            type: Number,
            required: false
        },
        desired_languages: {
            type: Array,
            required: false,
            default: () => ['ar', 'zh', 'en', 'fr', 'ru', 'es']
        },
        urls: {
            // if this prop exists, use the provided urls instead of doing fetching them from the API
            type: Array,
            required: false
        }
    },
    //props: ["api_prefix", "record_id", "desired_languages"],
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
            langmap: {en: 'E', ar: 'A', zh: 'C', fr: 'F', ru: 'R', es: 'S'},
            files: []
        }
    },
    created: async function() {
        if (this.urls) {
            this.files = this.urls
            return
        } else if (!this.api_url || !this.record_id) {
            throw new Error('"api_url" and "record_id" or "urls" required')
        }

        let url = `${this.api_prefix}marc/bibs/records/${this.record_id}/files`;
        fetch(url).then(
            response => response.json()
        ).then(
            json => {
                //this.files = json.data
                for (let lang of this.desired_languages) {
                    let file = json.data.find(f => f.language === lang);
                    if (file) {
                        this.files.push(file);
                    }
                }
            }
        )
    }
}