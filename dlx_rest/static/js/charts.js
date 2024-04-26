 
const ChartsEmbedSDK = window.ChartsEmbedSDK;
 
const sdk = new ChartsEmbedSDK({
  baseUrl: "https://charts.mongodb.com/charts-project-0-vbkva",  
});
  
const dashboardId = '2c30ae76-5b8e-4703-af90-797962da36fd'; 
const userCheckboxesContainer = document.getElementById('userCheckboxes');
 
// Create a function to update filters based on selected checkboxes
 function updateDashboard() {
    const selectedUsers = Array.from(document.querySelectorAll('input[type=checkbox]:checked'))
      .map(checkbox => checkbox.value);

    console.log("selectedUsers"+selectedUsers) 
   
    // Create or update the dashboard with the selected user filters

const chart = sdk.createDashboard({
    dashboardId: dashboardId,// ~REPLACE~ with the  ID from your Embed Chart dialog.
  height: "7000px"  ,
 filter: { user: { $in: selectedUsers} }            
  // Additional options go here 
});  
chart.render(document.getElementById("dashboard"));   


  } 
 
// Add an event listener to checkboxes to trigger updates
userCheckboxesContainer.addEventListener('change', function() {
    updateDashboard();
});  
  
// Check all checkboxes by default
document.querySelectorAll('input[type=checkbox]').forEach(checkbox => {
  checkbox.checked = true;
});
 

// Initial update with all users selected (optional)
updateDashboard();

