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
    }
}