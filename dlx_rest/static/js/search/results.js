import { previewmodal } from "../modals/preview.js"
import { countcomponent } from "./count.js"

export let searchresults = {
    props: {
        api_prefix: {
            type: String,
            required: true
        },
        collection: {
            type: String,
            required: true
        },
        results: {
            type: Array
        }
    },
    template:`
    <div>
        <div id="results-list" v-for="result in parsedResults" :key="result._id">
            <div class="row mt-1 bg-light border-bottom">
                <div class="col-sm-1">
                    <input :id="'input-' + collection + '-' + result._id" type="checkbox" disabled="true" data-toggle="tooltip" title="Select/deselect record"/>
                </div>
                <div>
                    <i :id="'preview-toggle-' + result._id"  class="fas fa-file preview-toggle" @click="togglePreview(collection, result._id)" title="preview record"></i>
                    <div :id="'preview-' + result._id" class="record-preview hidden">
                        <span class="record-preview-id">{{result._id}}</span>
                        </br>
                        <span :id="'preview-text-' + result._id" class="preview-text"></span>
                    </div>
                </div>
                <div class="col-sm-9 px-4">
                    <div v-if="collection != 'auths'" class="row" style="overflow-x:hidden">
                        <a :id="'link-' + result._id" class="result-link" :href="uibase + '/editor?records=' + collection + '/' + result._id" style="white-space:nowrap">{{result.first_line}}</a>
                        <countcomponent v-if="collection == 'auths'" :api_prefix="api_prefix" :recordId="result._id"></countcomponent>
                    </div>
                    <div v-else class="row" style="flex-wrap:inherit">
                        <a :id="'link-' + result._id" class="result-link" :href="uibase + '/editor?records=' + collection + '/' + result._id" style="overflow-wrap:break-word">{{result.first_line}}</a>
                        <countcomponent v-if="collection == 'auths'" :api_prefix="api_prefix" :recordId="result._id"></countcomponent>
                    </div>
                    <div class="row" style="white-space:nowrap">
                        {{result.second_line}}
                    </div>
                    <div class="row" v-for="agenda in result.agendas">
                        <span class="ml-3">{{agenda}}</span>
                    </div>
                </div>
                <div class="col-sm-1">
                    <!-- need to test if authenticated here -->
                    <div class="row ml-auto">
                        <a><i :id="'icon-' + collection + '-' + result._id" class="fas fa-2x" data-toggle="tooltip" title="Add to your basket"></i></a>
                    </div>
                </div>
            </div>
        </div>
        <previewmodal ref="previewmodal" :api_prefix="api_prefix"></previewmodal>
    </div>
    `,
    data: function () {
        let myUIBase = this.api_prefix.replace('/api/','')
        return {
            uibase: myUIBase
        }
    },
    computed: {
        parsedResults: function () {
            console.log(this.collection)
            let parsedResultSet = []
            for (let result of this.results) {
                let myResult = { "_id": result["_id"]}
                // Set first and second line for any collection
                myResult["first_line"] = result["title"]
                let rtype = result["types"].split("::")
                myResult["second_line"] = [result["symbol"], result["date"], rtype[rtype.length - 1]].filter(Boolean).join(" | ")
                
                // And override for just auths
                if (this.collection == "auths") {
                    myResult["first_line"] = result["heading"]
                    myResult["second_line"] = result["alt"]
                    myResult["heading_tag"] = result["heading_tag"]
                } 
                
                //if (this.collection == "files") {
                    // not implemented yet
                //}

                if (this.collection == "speeches") {
                    myResult["agendas"] = result["agendas"]
                }

                parsedResultSet.push(myResult)
            }
            return parsedResultSet
        }
    },
    methods: {
        togglePreview: async function (collection, recordId) {
            this.$refs.previewmodal.collection = collection == "auths" ? collection : "bibs"
            this.$refs.previewmodal.recordId = recordId
            this.$refs.previewmodal.show()
        },
    },
    components: {
        "countcomponent": countcomponent,
        "previewmodal": previewmodal
    }
}