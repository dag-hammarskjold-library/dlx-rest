import { Jmarc } from "../jmarc.mjs";

export default {
    // Individual item methods
    async createItem(api_prefix, basket_id='userprofile/my_profile/basket', collection, record_id, override=false) {
        
        Jmarc.apiUrl = api_prefix;
        let url = `${api_prefix}${basket_id}`;
        let myItemTitle = "";
        let myId = null;
        // Check here to see if the record is already in another basket? Return that fact, along with the user?
        Jmarc.get(collection, record_id).then(jmarc => {
            if(collection == "bibs") {
                let myTitleField = jmarc.getField(245,0);
                let myTitle = [];
                if (myTitleField) {
                    for (let s in myTitleField.subfields) {
                        myTitle.push(myTitleField.subfields[s].value);
                    }
                } else {
                    myTitle.push("[No Title]")
                }
                
                myItemTitle = myTitle.join(" ").replace(/"/g, `\\"`);
            } else if (collection == "auths") {
                //console.log("Trying to create an auth basket item...")
                let myTitleField = jmarc.fields.filter(x => x.tag.match(/^1[0-9][0-9]/))[0];
                let myTitle = [];
                for (let s in myTitleField.subfields) {
                    myTitle.push(myTitleField.subfields[s].value);
                }
                myItemTitle = myTitle.join(" ").replace(/"/g, `\\"`);
            }
            let data = `{"collection": "${collection}", "record_id": "${record_id}", "title": "${myItemTitle}", "override": ${override}}`
            //console.log(url)
            fetch(url, {
                method: 'POST',
                body: data
            }).catch( e => {
                console.log(e)
            })
        });

        return true
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