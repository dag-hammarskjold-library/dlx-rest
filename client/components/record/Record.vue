<template>
    <div>
        This is a record
        <div>
            Permission-gated record controls
        </div>
        <div v-for="field in record.fields">
            <span>{{ field.tag }}</span>
            <span>{{ field.indicators }}</span>
            <div v-for="subfield in field.subfields">{{ subfield.code }} {{ subfield.value }}</div>
        </div>
    </div>
</template>
<script lang="js">
export default {
    props: ["collection", "recordId"],
    data: function () {
        return {
            readOnly: true,
            record: {}
        }
    },
    created: async function () {
        // Load jmarc.mjs and use it to instantiate the record here
        // Get configs from nuxt.config.ts
        let config = useRuntimeConfig()
        let apiUrl = config.apiUrl
        this.record = {}
    },
    methods: {
        // Various things that can be done on the record, permissions allowing.
    }
}
</script>