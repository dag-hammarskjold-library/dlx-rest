/* 
The advanced search tool. It takes a set of search terms, which it can parse, 
and it can marshal advanced search terms into a search string.
*/

export let advancedsearchcomponent = {
    props: {
        searchTerm: {
            // this is what we're parsing so we can fill out the fields
            type: String,
            required: false
        }
    },
    template:`<div id="advancedSearch"></div>`,

}