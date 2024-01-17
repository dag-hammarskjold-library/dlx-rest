// Component
let doubleRecordDisplay = {
    template:`<div class='row container mt-3 shadow' style="overflow-y: scroll; height:900px;">
                  <div v-for="record in $parent.records" class="w-25 overflow-auto col-5 ml-3 mr-3 mt-3 mb-3 border-success bg-gradient border-3 border-start shadow-lg">
                      <h4 class='mt-3'> Record ID : {{record['myId']}} </h4>
                      <h6 class="text-success"> Last update :  {{record['myUpdated']}} </h6>
                      <hr>
                      <div class="border border-2" v-if="mtr.myTag !=='' " v-for="mtr in record['myTagRecord']">     
                           <span class='badge rounded-pill bg-secondary'> {{mtr.myTag}}</span> <span> {{mtr.myHeader}}</span> <span> {{mtr.myIndicators}}</span> 
                           <span v-for="sub in mtr.mySubFields">
                              <span class="text-primary fw-bold" ><br>$</span><span class="text-primary fw-bold">{{sub.code}}</span> <span>{{sub.value}} |</span> <span class="text-success fw-bold" v-if="sub.xref"> {{"@@@" + sub.xref}} </span>
                           </span>
                      </div>
                  </div>
              </div> 
              `,
      methods:{}
  }
  // Parent Vue
  
  let vm=new Vue({
      el: '#histo', 
      delimiters: ['[[',']]'],
      components:{doubleRecordDisplay},
      data:{
        visible:false,
        records:[],
        urls:[] // urls to display
      },
      methods:{
        displayData: async function(){

          if ((this.urls.length!==0) && (this.urls.length<3)){
    
              // Retrieving the url inside an array
                    let myUrls= this.urls;
                    
                    // Retrieve the number of url
                    let mySize=myUrls.length
                    
                    // Loop the array of URLS
                    for (i = 0; i < mySize; i++) {
                
                      let myRecord={ 
                        myId:"",
                        myUpdated:"",
                        myTagRecord:[
                          {
                            myTag:"",
                            myHeader:"",
                            myIndicators:[
                            {
                              myIndicator1:"",
                              myIndicator2:""
                            }
                          ],
                            mySubFields:[
                              {
                                myCode:"",
                                myValue:"",
                                myXref:""
                              }
                            ]
                          }
                        ]
                      }
                      
                
                      // retrieving data from API
                      let response = await fetch(myUrls[i]);
                    
                      // process to fecth data for the full record
                      if (response.ok) {
                          let myJson= await response.json();
                
                          // assign the ID value
                          myRecord.myId=myJson["data"]['_id'];
                
                          // assign the updated value
                          myRecord.myUpdated=myJson["data"]['updated'];
                          
                          // Retrieve the value of the tag
                          let mylistTags=Object.keys(myJson["data"]).sort()
                          
                          // Loop to display the tags and the values
                          for (j = 0; j < mylistTags.length; j++){
                
                              if (mylistTags[j]!=="_id" && mylistTags[j]!=="updated"  && mylistTags[j]!=="files"){
                                
                                // assign the tag value
                                myTag=mylistTags[j]
                                
                                // size of the tag record array
                                let sizeTagRecord = myJson["data"][myTag].length
                
                                  // loop inside the tag record array
                                  for (k = 0; k < sizeTagRecord; k++){                
                                    
                                    let saveRecord={}
                                    saveRecord.myTag=myTag
                
                                    // header case
                                    if (myTag){
                                        if (parseInt(myTag)==parseInt('000') || parseInt(myTag)==parseInt('001') || parseInt(myTag)==parseInt('002') || parseInt(myTag)==parseInt('003') || parseInt(myTag)==parseInt('004') || parseInt(myTag)==parseInt('005') || parseInt(myTag)==parseInt('007') || parseInt(myTag)==parseInt('008')) {
                                          saveRecord.myHeader=myJson["data"][myTag]
                                        } 
                                        // rest of the tag
                                        else {
                                          myIndicators=myJson["data"][myTag][k]["indicators"]
                                          mySubFields=myJson["data"][myTag][k]["subfields"]
                                          
                
                                          // save value
                                          saveRecord.myIndicators=myIndicators
                                          saveRecord.mySubFields=mySubFields
                                        }
                                      }
                                    myRecord.myTagRecord.push(saveRecord)
                                  }
                              }
                          }
                      } 
                      vm.records.push(myRecord)
                    }
            }
          }
        }
    })