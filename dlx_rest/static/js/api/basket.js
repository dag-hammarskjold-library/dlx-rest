import { Jmarc } from "../jmarc.mjs";

export default {
    // Individual item methods
    async createItem(api_prefix, basket_id='userprofile/my_profile/basket', collection, record_id, override=false) {        
        let url = `${api_prefix}${basket_id}`;
        let data = `{"collection": "${collection}", "record_id": "${record_id}", "title": "[No Title]", "override": ${override}}`

        await fetch(url, {
            method: 'POST',
            body: data
        })

        return true
    },
    async createItems(api_prefix, basket_id='userprofile/my_profile/basket', items) {
        let url = `${api_prefix}${basket_id}/addBulk`;
        if (items.length > 0) {
            await fetch(url, {method: "POST", body: items})
            return true
        }
    },
    async getItem(api_prefix, collection, record_id) {
        Jmarc.api_prefix = api_prefix;
        let returnObj = {};
        await Jmarc.get(collection, record_id).then(jmarc => {
            returnObj = jmarc;
        });
        return returnObj;
    },
    async deleteItem(api_prefix, basket_id='userprofile/my_profile/basket', myBasket, collection, record_id) {
        for (let item of myBasket) {
            //let url = `${api_prefix}${basket_id}/items/${item.id}`
            if (item.record_id == record_id && item.collection == collection) {
                await fetch(item.url, {method:"DELETE"});
            }
        }
        return true;
    },

    async itemLocked(api_prefix, collection, record_id) {
        let url = `${api_prefix}marc/${collection}/records/${record_id}/locked`
        let res = await fetch(url);
        let jsonData = await res.json();
        //console.log(jsonData);
        return jsonData;
    },

    // Basket methods
    async getBasket(api_prefix, basket_id='userprofile/my_profile/basket') {
        let url = `${api_prefix}${basket_id}`
        const response = await fetch(url);
        const jsonData = await response.json();
        const returnData = new Set(jsonData.data.item_data.sort((a,b) => a - b))
        return returnData;
    },
    async clearItems(api_prefix, basket_id='userprofile/my_profile/basket') {
        let url = `${api_prefix}${basket_id}/clear`
        await fetch(url, {method:"POST"}).then(() => {return true} )
    },
    contains(collection, record_id, basket) {
        for (let item of basket) {
            if (item.collection == collection && item.record_id == record_id) {
                return true;
            }
        }
        return false;
    }
}