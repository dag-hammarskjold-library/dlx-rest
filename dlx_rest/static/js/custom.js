function addBasket(myRecordId,myCollection,myTitle,myPrefix){
          
    // fetch the data from the api
    let url=myPrefix+"userprofile/my_profile/basket"
    console.log(url)

    // prepare the data to load
    data=`{"collection": "${myCollection}", "record_id": "${myRecordId}", "title": "${myTitle}"}`
    console.log(data)

    // call the api route with POST method
    fetch(url, {
      method: 'POST',
      body: data
      })
      
      // success
      .then(response => {
          if (response.ok) {	
            alert("Item "+ myRecordId +"("+ myCollection + ")  added to the basket ")
        }
      })

      // failure
      .catch(error => {
        alert("Oups!!!  Item "+ myRecordId +"("+ myCollection + ") not added to the basket ")
      })
}
