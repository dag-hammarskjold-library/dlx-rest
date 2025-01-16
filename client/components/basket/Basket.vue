<template>
    <div style="border:1px solid; margin: 5px;">
        This is the basket. It contains zero or more items.
        <div>
            This is a set of basket controls. 
        </div>
        <div v-for="item in items">
            This is an item.
        </div>
    </div>
</template>
<script lang="js">
export default {
    // When we load this, we need to know about the user
    props: ["basketId"],
    data: function () {
        return {
            items: []
        }
    },
    methods: {
        addItem: function () {},
        removeItem: function () {},
        clearBasket: function () {}
        // etc
    }
}
</script>