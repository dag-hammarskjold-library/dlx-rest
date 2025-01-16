<template>
    <div style="border:1px solid; margin: 5px;">
        Simple search component loaded from /pages/[collection]/index.vue
        <br>
        Primed with this.query if it exists.
        <br>
    </div>
</template>
<script lang="js">
/* 
Simple search componenent. Displays a simple search input and search button.
*/
export default {
    data: function () {
        return {
            query: null
        }
    },
    emits: function () {
        // emit events in response to changes, e.g., to the query, which then updates
        // location bar

    }
}
</script>