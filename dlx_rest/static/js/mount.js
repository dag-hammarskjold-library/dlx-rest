import { editorcomponent } from './components/editor.js';
import { searchcomponent } from './components/search.js';
import { authreviewcomponent } from './components/auth_review.js';
import { speechreviewcomponent } from './components/speech_review.js';
import { browsecomponent } from './components/browse.js';
import { importcomponent } from './components/import.js';
import { workformcomponent } from './components/workform.js';

const apiPrefix = window.API_PREFIX || '/api/';

/* Mount the editor, which consists of a basket, a header, and the record displays */
const editorRoot = document.getElementById('editor-root');

if (editorRoot) {
    new Vue({
        render: h => h(editorcomponent, {
            props: {
                api_prefix: apiPrefix
            }
        })
    }).$mount('#editor-root');
}

/* Mount the search component if there's a search root element */
const searchRoot = document.getElementById('search-root');
const searchCollection = searchRoot?.dataset.collection || 'bibs';

if (searchRoot) {
    new Vue({
        render: h => h(searchcomponent, {
            props: {
                api_prefix: apiPrefix,
                collection: searchCollection
            }
        })
    }).$mount('#search-root');
}

/* Auth review */
const authReviewRoot = document.getElementById('auth-review-root');

if (authReviewRoot) {
    new Vue({
        render: h => h(authreviewcomponent, {
            props: {
                api_prefix: apiPrefix
            }
        })
    }).$mount('#auth-review-root');
}

/* Speech review */
const speechReviewRoot = document.getElementById('speech-review-root');

if (speechReviewRoot) {
    new Vue({
        render: h => h(speechreviewcomponent, {
            props: {
                api_prefix: apiPrefix
            }
        })
    }).$mount('#speech-review-root');
}

/* Browse */
const browseRoot = document.getElementById('browse-root');
const browseCollection = browseRoot?.dataset.collection || 'bibs'
const browseQ = browseRoot?.dataset.q || null
const browseIndex = browseRoot?.dataset.index || null

if (browseRoot) {
    new Vue({
        render: h => h(browsecomponent, {
            props: {
                api_prefix: apiPrefix,
                collection: browseCollection,
                index: browseIndex,
                q: browseQ
            }
        })
    }).$mount('#browse-root');
}

/* Import */
const importRoot = document.getElementById('import-root');

if (importRoot) {
    new Vue({
        render: h => h(importcomponent, {
            props: {
                api_prefix: apiPrefix
            }
        })
    }).$mount('#import-root');
}

/* Workforms */
const workformRoot = document.getElementById('workform-root');

if (workformRoot) {
    new Vue({
        render: h => h(workformcomponent, {
            props: {
                api_prefix: apiPrefix
            }
        })
    }).$mount('#workform-root');
}

/*** 
Other components can be mounted here as well once they're developed.
To do: unified file component
***/