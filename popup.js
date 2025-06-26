document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const editBtn = document.getElementById('editBtn');

  // Start form filler when Start button is clicked
  startBtn.addEventListener('click', function() {
    // Send a message to the active tab to start form filler
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "start_form_filler"});
      window.close(); // Close the popup
    });
  });

  // Open options page when Edit button is clicked
  editBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
    window.close(); // Close the popup
  });
}); 