if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./background.js")
      .then((registration) => {
        console.log("ServiceWorker registered");
      })
      .catch((err) => {
        console.log("ServiceWorker registration failed:", err);
      });
  });
}
