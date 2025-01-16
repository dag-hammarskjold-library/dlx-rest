<template>
    <div>
        {{ collection }} landing page.
        <br>
        Loads the following components: 
            SimpleSearch (components/search/SimpleSearch), 
            AdvancedSearch (components/search/AdvancedSearch),
            Sort (components/search/Sort)
        <br>
        <SearchSimple />
        <SearchAdvanced />
        <!-- <SearchSort /> -->
        <SearchResults v-if="results" :results="results" />
    </div>
</template>
<script setup lang="js">
/* 
This index page can handle basic routing (route.params.collection) and route.query

It uses the composition API, but could also use options API. It shows how we can 
use both composition API and options API in the same app.

This file and the suggested composable below can also be written in TypeScript, but 
note that doing so requires creating interfaces for data types, which is more 
effort overall.
*/
const route = useRoute()
const collection = route.params.collection
const query = route.query

// Use a composable here to get results?
// The composable is stored in /composables/useResults.ts or .js
// const results = useResults(query)
const results = []
</script>