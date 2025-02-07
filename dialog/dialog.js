// Add an event listener to the save button
document.getElementById("save").addEventListener("click", () => {
  // Get the values from the title and category input fields
  const title = document.getElementById("title").value;
  const category = document.getElementById("category").value;

  // Check if a title is provided
  if (title) {
    // Send a message to the background script to save the data
    chrome.runtime.sendMessage({
      type: "saveData",
      data: { title, category },
    });
  }
});