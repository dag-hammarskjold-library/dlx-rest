export const BasketRecord = {
    props: { jmarc: Object, active: Boolean },
    data() {
        return {
            classes: {
                basketRecord: {
                    "basket-record": true,
                    "basket-record__selected": this.active
                }
            }
        }
    },
    watch: {
        active(newVal) {
            this.classes.basketRecord["basket-record__selected"] = newVal
        }
    },
    computed: {
        symbol() {
            let field = this.jmarc.getField("191")
            if (!field) field = this.jmarc.getField("791")
            return field ? field.getSubfield("a").value : ""
        }
    },
    template: /* html */ `
    <div :class="classes.basketRecord">
      {{ jmarc.collection + "/" + jmarc.recordId }}
      <br>
      {{ symbol }}
    </div>
  `
}