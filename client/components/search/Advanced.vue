<template>
    <div style="border:1px solid; margin: 5px;">
        Advanced search component loaded from /pages/[collection]/index.vue
        <br>
        Primed with this.query if it exists.
        <br>
    </div>
</template>
<script lang="js">
/* 
Advanced search componenent. Displays a series of search boxes allowing query terms to 
be strung together. Ultimately becomes a contiguous search string.
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