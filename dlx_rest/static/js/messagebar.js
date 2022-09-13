/////////////////////////////////////////////////////////////////
// MESSAGE BAR COMPONENT
/////////////////////////////////////////////////////////////////
let vm=""
export let messagecomponent = {
    template: `<div id="messageBar"></div>`,
    created() {
        this.$root.$refs.messagecomponent = this;
        vm=this;
    },
    methods: {
      changeStyling(myText, myStyle) {
        let classList = myStyle.split(" ")
        let bar = document.getElementById("messageBar")
        let msgDiv = document.createElement("div")
        for (let c of classList) {
            msgDiv.classList.add(c)
        }
        bar.appendChild(msgDiv)
        let msgSpan = document.createElement("span")
        msgSpan.id = "messageText"
        msgSpan.classList.add("ml-3")
        msgSpan.innerText = myText
        msgDiv.appendChild(msgSpan)

        let timeoutID = setTimeout(
          function(){
            msgDiv.remove()
          }
          ,10000
        )
      }
    }
  }