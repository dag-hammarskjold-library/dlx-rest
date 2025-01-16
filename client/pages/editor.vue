<template>
    <div>
        This is the editor. It contains some top-level controls, a basket, and a record stage.
        <div>Top-Level Editor Controls</div>
        <Basket :basket-id="12345" />
        <RecordStage :records="records" />
    </div>
</template>
<script lang="js">
export default {
    data: function () {
        return {
            records: []
        }
    }
}
</script>