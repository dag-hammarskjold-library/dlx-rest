function addRemoveBasket(myFunc, myRecordId,myCollection,myPrefix) {
    if (myFunc == "add") {
      addBasket(myRecordId,myCollection,myPrefix)
    } else if (myFunc == "remove") {
      removeBasket(myRecordId, myCollection, myPrefix)
    }
}

function addBasket(myRecordId,myCollection,myPrefix){
          
    // fetch the data from the api
    let url=myPrefix+"userprofile/my_profile/basket"
    console.log(url)

    // prepare the data to load
    data=`{"collection": "${myCollection}", "record_id": "${myRecordId}"}`
    console.log(data)

    // call the api route with POST method
    fetch(url, {
      method: 'POST',
      body: data
      })
      
      // success
      .then(response => response.json())
      .then(data => {
          console.log(data)
          el = document.querySelector("#" + myCollection + "-" + myRecordId)
          el.setAttribute("data-basketItem", data["id"])
          el.setAttribute("class", "fas fa-folder-minus")
          el.setAttribute("title", "Remove from your basket")
          el.setAttribute("onclick", "addRemoveBasket(`remove`,`" + myRecordId + "`,`" + myCollection + "`,`" + myPrefix + "`)")
          flashMessage("Item "+ myRecordId +"("+ myCollection + ") was added to the basket...", "success")
      })

      // failure
      .catch(error => {
        console.log(error)
        flashMessage("Item "+ myRecordId +"("+ myCollection + ") could not be added to the basket...", "danger")
        //alert("Oups!!!  Item "+ myRecordId +"("+ myCollection + ") not added to the basket ")
      })
}

function removeBasket(myRecordId, myCollection, myPrefix) {
     // fetch the data from the api
     let el = document.querySelector("#" + myCollection + "-" + myRecordId)
     let url=myPrefix+"userprofile/my_profile/basket/items/" + el.getAttribute("data-basketItem")

     //console.log(url)
 
     // prepare the data to load
     //data=`{"id": "${myItemId}"}`
     //console.log(data)
 
     // call the api route with POST method
     fetch(url, {
       method: 'DELETE',
       //body: data
       })
       
       // success
       .then(response => {
           console.log(data)
           el = document.querySelector("#" + myCollection + "-" + myRecordId)
           //el.setAttribute("data-basketItem", data["id"])
           el.setAttribute("class", "fas fa-folder-plus")
           el.setAttribute("title", "Add to your basket")
           el.removeAttribute("data-basketItem")
           el.setAttribute("onclick", "addRemoveBasket(`add`,`" + myRecordId + "`,`" + myCollection + "`,`" + myPrefix + "`)")
           flashMessage("Item "+ myRecordId +"("+ myCollection + ") was removed from the basket...", "success")
       })
 
       // failure
       .catch(error => {
         console.log(error)
         flashMessage("Item "+ myRecordId +"("+ myCollection + ") could not be removed from the basket...", "danger")
         //alert("Oups!!!  Item "+ myRecordId +"("+ myCollection + ") not added to the basket ")
       })
}

function flashMessage(message, alertStatus) {
  let el = document.querySelector("#message-bar")
  //el.setAttribute("class","alert alert-" + alertStatus)
  let currClass = el.getAttribute("class")
  el.setAttribute("class", currClass + " alert alert-" + alertStatus)
  el.innerText = message;
}