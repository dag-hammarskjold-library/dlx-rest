import { Jmarc } from "../api/jmarc.mjs"

export let readonlyrecord = {
    props: ["api_prefix", "collection", "record_id"],
    template: `<div class="container">
        <h5>{{virtualCollection}}/{{record_id}}</h5>
        <div v-for="field in record.fields" class="field" :data-tag="field.tag">
            <code class="text-primary">{{field.tag}}</code>
            <span v-if="!field.subfields">{{field.value}}</span>
            <span v-for="subfield in field.subfields">
                <code>\${{subfield.code}}</code>{{subfield.value}}
            </span>
        </div>
    </div>`,
    data: function () {
        return {
            record: {},
            virtualCollection: null
        }
    },
    created: function () {
        Jmarc.apiUrl = this.api_prefix

        let promise = Jmarc.get(this.collection, this.record_id)

        promise.then( jmarc => {
            this.record = jmarc
            this.virtualCollection = jmarc.getVirtualCollection()
        })
    }
}