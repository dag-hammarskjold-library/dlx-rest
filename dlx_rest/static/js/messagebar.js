/////////////////////////////////////////////////////////////////
// MESSAGE BAR COMPONENT
/////////////////////////////////////////////////////////////////
let vm=""
export let messagecomponent = {
    template: `
      <div id="messageBar" style="background-color: lightgrey; height: 25px; overflow-y: scroll">
        
      </div>
    `,
    methods: {
      changeStyling(myText, myStyle) {
        let classList = myStyle.split(" ")
        let bar = document.getElementById("messageBar")
        let msgDiv = document.createElement("div")
        for (let c of classList) {
            msgDiv.classList.add(c)
        }
        bar.prepend(msgDiv)
        let msgSpan = document.createElement("span")
        msgSpan.id = "messageText"
        msgSpan.classList.add("ml-3")
        msgSpan.innerText = myText
        msgDiv.appendChild(msgSpan)
        bar.scrollTop = 0;

        let timeoutID = setTimeout(
          function() {
            msgDiv.style = "background-color: lightgrey";
          },
          5000
        )
      }
    }
  }