

const target = document.getElementById("target");
const myFile = document.getElementById("files");

myFile.addEventListener("change", () => {
  // alert("New change")
  // const tableToRemove = document.getElementById("table_upload");
  // if (tableToRemove) tableToRemove.remove()

});


myFile.addEventListener("dragenter", () => {
  target.style.backgroundColor = '#DCDCDC';
});

myFile.addEventListener("drop", () => {
    target.style.backgroundColor = 'white';
});

myFile.addEventListener("dragleave", () => {
  target.style.backgroundColor = 'white';
});

// function removeFileFromFileList(fileName) {
//     const dt = new DataTransfer()
//     const input = document.getElementById('files')
//     const { files } = input
    
//     for (let i = 0; i < files.length; i++) {
//       const file = files[i]
//       if (fileName !== file.name)
//         dt.items.add(file)
//     }
//     input.files = ""
//     input.files = dt.files 
//     alert(input.files)
// }



// this function is calculating the size of the files to upload and render some information 
$("div *").change(function() {
    resetUI()
    let file = document.getElementById("files");
    let btn = document.getElementById("process");
    let limitSize=1073741824
    let correct=document.getElementById("correctsize");
    let incorrect=document.getElementById("incorrectsize");
    let myIcon=document.getElementById("myicon");

        if (file.files.length == 0 ){
          btn.style.display = 'none';
        } 
        
        let sizeFile=0
        for (let myfile of file.files){
          sizeFile+=myfile.size
        }

        if (file.files.length > 0 )
            if(sizeFile>limitSize) {
              //incorrect.textContent=`The total size of your files is > ${limitSize} kb (1Gb). Consider uploading less,otherwise your request might not be served`
              incorrect.textContent=`The total size of your files is > 1GB. Consider uploading less,otherwise your request might not be served`
              myIcon.style.display= 'inline-block'; 
              myIcon.style.color= '#dc3545';  
              incorrect.style.display= 'inline-block'; 
              
            } else {
              correct.textContent=`The total size of your files is : ${(sizeFile/1048576).toFixed(2)} MB`
              myIcon.style.display= 'inline-block';
              myIcon.style.color= '#28a745'; 
              correct.style.display= 'inline-block';  
              btn.style.display = 'inline-block';
              
              }
})
  
  // this function reset some visual elements
  function resetUI(){
      
    let correct=document.getElementById("correctsize");
    let incorrect=document.getElementById("incorrectsize");
    let myIcon=document.getElementById("myicon");
    let btn = document.getElementById("process");
  
    // reset the message about the size of the upload
    incorrect.style.display= 'none';  
    correct.style.display= 'none';  
    myIcon.style.display= 'none';
  
    // reset the button to process
    btn.style.display = 'none';
  }
  


function deleteRow(){
  
    // 1- visual process
  
      // get the number of rows
      let rowCount = $("#table_upload tr").length;
  
      // event.target will be the input element.
      let fileToRemove = event.target.parentNode.id; 
      let td = event.target.parentNode; 
      let tr = td.parentNode; // the row to be removed
      tr.parentNode.removeChild(tr);
      if (rowCount==2) {
        resetUI()
        let myTable=document.getElementById("table_upload");
        // remove the table
        if (myTable) myTable.parentNode.removeChild(myTable);
      }
  
    // 2- file content process

        let myListFiles= new DataTransfer()
        let input = document.getElementById("files");
        let myFiles = input.files;
        for (const file of myFiles) {
            if (file.name!==fileToRemove) myListFiles.items.add(file)
        }
    
    document.getElementById("files").value =""
    //document.getElementById("files").value = myListFiles

  }