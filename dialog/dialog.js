document.getElementById("save").addEventListener("click", () => {
  const title = document.getElementById("title").value;
  const category = document.getElementById("category").value;

  if (title) {
    chrome.runtime.sendMessage({
      type: "saveData",
      data: { title, category },
    });
  }
});
