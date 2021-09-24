import { Jmarc } from "../jmarc.js";

export default {
    // Individual item methods
    createItem(api_prefix, basket_id='userprofile/my_basket', record_id, collection) {
        Jmarc.apiUrl = api_prefix;
        let url = `${api_prefix}/${basket_id}/items`;
        let myItemTitle = "";
        let myId = null;
        Jmarc.get(myCollection, myRecordId).then(jmarc => {
            if(myCollection == "bibs") {
                let myTitleField = jmarc.getField(245,0);
                let myTitle = [];
                for (let s in myTitleField.subfields) {
                    myTitle.push(myTitleField.subfields[s].value);
                }
                myItemTitle = myTitle.join(" ");
            } else if (myCollection == "auths") {
                let myTitleField = jmarc.fields.filter(x => x.tag.match(/^1[0-9][0-9]/))[0];
                let myTitle = [];
                for (let s in myTitleField.subfields) {
                    myTitle.push(myTitleField.subfields[s].value);
                }
                myItemTitle = myTitle.join(" ");
            }
            let data = `{"collection": "${myCollection}", "record_id": "${myRecordId}", "title": "${myItemTitle}"}`
            fetch(url, {
                method: 'POST',
                body: data
            });
        });
        return true;
    },
    getItem(api_prefix, basket_id='userprofile/my_basket', item_id) {
        let url = `${api_prefix}/${basket_id}/items/${item_id}`
    },
    deleteItem(api_prefix, basket_id='userprofile/my_basket', item_id) {
        let url = `${api_prefix}/${basket_id}/items/${item_id}`
    },

    // Basket methods
    getBasket(api_prefix, basket_id='userprofile/my_basket') {
        Jmarc.apiUrl = api_prefix
        let url = `${api_prefix}/${basket_id}`
    },
    clearItems(api_prefix, basket_id='userprofile/my_basket') {
        let url = `${api_prefix}/${basket_id}`
    }
}