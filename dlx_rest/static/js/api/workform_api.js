import { Jmarc } from "../jmarc.js"; //?

export default {
    async listWorkforms(api_prefix, collection) {
        let myUrl = `${api_prefix}marc/${collection}/workforms`;
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
        let url = `${api_prefix}marc/${collection}/workforms/${id}`;
        let response = await fetch(url);
        let jsonData = await response.json();
        let myData = jsonData.data;
        let jmarc = new Jmarc(collection);
        jmarc.parse(myData);
        return jmarc;
    },
    async createWorkform(api_prefix, collection, data) {
        let url = `${api_prefix}marc/${collection}/workforms`;
        console.log(url);
        console.log(data)
        await fetch(url, {
            method:"POST",
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => {
            return true;
        });
    },
    async updateWorkform(api_prefix, collection, id, data) {
        let url = `${api_prefix}marc/${collection}/workforms/${id}`;
        await fetch(url, {
            method:"PUT",
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => {
            return true;
        });
    },
    async deleteWorkform(api_prefix, collection, id) {
        let url = `${api_prefix}marc/${collection}/workforms/${id}`;
        await fetch(url, {method:"DELETE"}).then(response => {
            return true;
        });
    }
}