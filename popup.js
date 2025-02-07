document.addEventListener("DOMContentLoaded", init);

async function init() {
  const search = document.getElementById("search");
  const entriesContainer = document.getElementById("entries");
  const categoriesContainer = document.getElementById("categories");

  let allEntries = [];
  let currentCategory = "all";

  // Load entries
  const { entries } = await chrome.storage.local.get({ entries: [] });
  allEntries = entries;

  // Render categories
  renderCategories();
  // Initial render
  renderEntries(allEntries);
  
  // Search functionality
  search.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = filterEntries(term, currentCategory);
    renderEntries(filtered);
  });

  function filterEntries(term, category) {
    return allEntries.filter((entry) => {
      const matchesText = entry.text.toLowerCase().includes(term) || entry.title.toLowerCase().includes(term);
      const matchesCategory = category === "all" || entry.category === category;
      return matchesText && matchesCategory;
    });
  }

  function renderCategories() {
    const categories = ["all", ...new Set(allEntries.map((e) => e.category))];
    categoriesContainer.innerHTML = categories
      .map(
        (cat) => `
      <button class="category ${cat === currentCategory ? "active" : ""}" 
              data-cat="${cat}">
        ${cat}
      </button>
    `
      )
      .join("");

    categoriesContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("category")) {
        currentCategory = e.target.dataset.cat;
        document.querySelectorAll(".category").forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");
        const filtered = filterEntries(search.value.toLowerCase(), currentCategory);
        renderEntries(filtered);
      }
    });
  }

  function renderEntries(entries) {
    entriesContainer.innerHTML = entries
      .map(
        (entry) => `
      <div class="entry-card">
        <div class="header">
          <h3>${entry.title}</h3>
          <span class="category-tag">${entry.category}</span>
        </div>
        <p class="content">${entry.text}</p>
        <div class="footer">
          <a href="${entry.url}" target="_blank" class="url">View Source</a>
          <span class="time">${new Date(entry.timestamp).toLocaleString()}</span>
        </div>
      </div>
    `
      )
      .join("");
  }
  
  document.addEventListener("DOMContentLoaded", async () => {
    // Check if service worker is ready
    if (!chrome.runtime?.id) {
      console.error("Extension context invalidated!");
      return;
    }

    // Add retry logic for service worker
    const maxRetries = 3;
    let retries = 0;

    async function initialize() {
      try {
        await chrome.runtime.sendMessage({ type: "keepAlive" });
        init();
      } catch (error) {
        if (retries++ < maxRetries) {
          setTimeout(initialize, 100 * retries);
        } else {
          console.error("Failed to initialize service worker:", error);
        }
      }
    }

    initialize();
  });
}
