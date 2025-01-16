<template>
    <div>
        This is the record stage. It handles the display of records.
        <Record v-for="record in records" />
    </div>
</template>
<script lang="js">
export default {
    props: ["records"],
    data: function () {
        return {}
    }
}
</script>