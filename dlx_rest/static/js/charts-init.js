// Wait for both DOM and MongoDB Charts SDK to be ready
function waitForSDK(callback, maxAttempts = 50) {
  let attempts = 0;
  
  function checkSDK() {
    attempts++;
    console.log(`Checking for MongoDB Charts SDK (attempt ${attempts}/${maxAttempts})...`);
    
    if (typeof window.ChartsEmbedSDK !== 'undefined') {
      console.log('MongoDB Charts SDK found!');
      callback();
    } else if (attempts >= maxAttempts) {
      console.error('MongoDB Charts SDK not found after maximum attempts');
    } else {
      setTimeout(checkSDK, 100);
    }
  }
  
  checkSDK();
}

function initializeCharts() {
  try {
    console.log('Initializing charts...');
    console.log('DOM ready state:', document.readyState);
    console.log('MongoDB Charts SDK available:', typeof window.ChartsEmbedSDK !== 'undefined');
    console.log('userCheckboxes element:', document.getElementById('userCheckboxes'));

    // Check if we're on the dashboard page
    const userCheckboxesContainer = document.getElementById('userCheckboxes');
    if (!userCheckboxesContainer) {
      console.log('Not on dashboard page, skipping charts initialization');
      return;
    }

    const ChartsEmbedSDK = window.ChartsEmbedSDK;
    const sdk = new ChartsEmbedSDK({
      baseUrl: "https://charts.mongodb.com/charts-project-0-vbkva",  
    });

    const dashboardId = '2c30ae76-5b8e-4703-af90-797962da36fd';

    // Create a function to update filters based on selected checkboxes
    function updateDashboard() {
      const selectedUsers = Array.from(document.querySelectorAll('input[type=checkbox]:checked'))
        .map(checkbox => checkbox.value);

      console.log("Selected users:", selectedUsers);
     
      // Create or update the dashboard with the selected user filters
      const chart = sdk.createDashboard({
        dashboardId: dashboardId,
        filter: { user: { $in: selectedUsers} }            
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
 
    // Initial update with all users selected
    updateDashboard();
  } catch (error) {
    console.error('Error initializing charts:', error);
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  console.log('DOM is still loading, waiting for DOMContentLoaded event...');
  document.addEventListener('DOMContentLoaded', function() {
    waitForSDK(initializeCharts);
  });
} else {
  console.log('DOM is already loaded, initializing immediately...');
  waitForSDK(initializeCharts);
} 