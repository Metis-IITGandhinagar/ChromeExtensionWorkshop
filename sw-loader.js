// Check if the browser supports service workers
if ("serviceWorker" in navigator) {
  // Add an event listener to register the service worker when the window loads
  window.addEventListener("load", () => {
    // Register the service worker
    navigator.serviceWorker
      .register("./background.js")
      // If registration is successful
      .then((registration) => {
        // Log a success message to the console
        console.log("ServiceWorker registered");
      })
      // If registration fails
      .catch((err) => {
        // Log an error message to the console
        console.log("ServiceWorker registration failed:", err);
      });
  });
}