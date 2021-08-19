/////////////////////////////////////////////////////////////////
// MESSAGE BAR COMPONENT
/////////////////////////////////////////////////////////////////
let vm=""
export let messagecomponent = {
    template: `
            <div v-bind:class="styleToDisplay" role="alert">
              <span id="messageText" class="ml-3">{{textToDisplay}}</span>
            </div>
             `
    ,
    created() {
      this.$root.$refs.messagecomponent = this;
      vm=this;
    },
    data: function () {
      return {
        visible: true,
        textToDisplay: "Messaging bar", // just insert the string to display
        styleToDisplay: "row alert alert-primary",
        // list of values : // alert alert-primary // alert alert-secondary // alert alert-success // alert alert-danger // alert alert-warning // alert alert-info // alert alert-light // alert alert-dark
      }
    }
    ,
    methods: {
      changeStyling(myText, myStyle) {
        vm.textToDisplay = myText
        vm.styleToDisplay = myStyle
        let timeoutID= setTimeout(
          function(){
          vm.textToDisplay="Messaging bar", // just insert the string to display
          vm.styleToDisplay="row alert alert-primary" 
          }
          ,10000
        )
      }
    }
  }