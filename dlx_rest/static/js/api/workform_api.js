import { Jmarc } from "../jmarc.js"; //?

export default {
    async listWorkforms(api_prefix, collection) {
        let myUrl = `${api_prefix}marc/${collection}/templates`;
        let response = await fetch(myUrl);
        let jsonData = await response.json();
        let urlList = jsonData.data
        let returnData = [];
        for (let url of urlList) {
            let wfResponse = await fetch(url);
            let wfjsonData = await wfResponse.json();
            let myData = wfjsonData.data;
            returnData.push(
                {
                    'url': url,
                    'data': myData
                }
            );
        }
        return returnData;
    },

    async getWorkform(api_prefix, collection, id) {
        let url = `${api_prefix}marc/${collection}/templates/${id}`;
        console.log(url);
        let response = await fetch(url);
        let jsonData = await response.json();
        let myData = jsonData.data;
        let jmarc = new Jmarc(collection);
        jmarc.parse(myData);
        return jmarc;
    }
}