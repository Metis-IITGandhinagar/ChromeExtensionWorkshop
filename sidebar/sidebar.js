document.addEventListener("DOMContentLoaded", init);

const GROQ_API_KEY = "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"; // Replace with actual key
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

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

  chrome.storage.onChanged.addListener(async() => {
    const { entries } = await chrome.storage.local.get({ entries: [] });
    allEntries = entries;

    // Render categories
    renderCategories();
    // Initial render
    renderEntries(allEntries);
  })

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
      ${
        entry.summary
          ? `
        <div class="summary">
          <strong>Summary:</strong>
          <p>${entry.summary}</p>
        </div>
      `
          : ""
      }
      <div class="footer">
        <a href="${entry.url}" target="_blank" class="url">View Source</a>
        <div class="actions" style="display: flex;">
          <span class="time">${new Date(entry.timestamp).toLocaleString()}</span>
          ${
            !entry.summary
              ? `
            <button class="summarize-btn" data-timestamp="${entry.timestamp}">
              Summarize
            </button>
          `
              : ""
          }
          <button class="remove-btn" data-timestamp="${entry.timestamp}">Remove</button>
        </div>
      </div>
    </div>
  `
      )
      .join("");

    // Add summarize handlers
    document.querySelectorAll(".summarize-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const timestamp = Number(e.target.dataset.timestamp);
        const entry = allEntries.find((entry) => entry.timestamp === timestamp);

        e.target.textContent = "Summarizing...";
        e.target.disabled = true;

        const summary = await summarizeText(entry.text);

        if (summary) {
          const updatedEntry = { ...entry, summary };
          await updateEntry(updatedEntry);
        }

        e.target.textContent = "Summarize";
        e.target.disabled = false;
      });
    });
    document.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", async(e) => {
        const timestamp = Number(e.target.dataset.timestamp);
        const entry = allEntries.find((entry) => entry.timestamp === timestamp);

        const isConfirmed = confirm(`Are you sure you want to remove the entry: ${entry.title}`);
        if (isConfirmed) {
          const updatedEntries = allEntries.filter((entry) => entry.timestamp !== timestamp);
          await chrome.storage.local.set({ entries: updatedEntries });
          allEntries = updatedEntries;
          renderEntries(updatedEntries);
        }
      })
    });

  }
}

async function summarizeText(text) {
  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "user",
            content: `Summarize this text while maintaining key information. Keep it concise and under 100 words. Text: ${text}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Summarization failed:", error);
    return null;
  }
}

async function updateEntry(updatedEntry) {
  const { entries } = await chrome.storage.local.get({ entries: [] });
  const updatedEntries = entries.map((entry) => (entry.timestamp === updatedEntry.timestamp ? updatedEntry : entry));
  await chrome.storage.local.set({ entries: updatedEntries });
  allEntries = updatedEntries;

  // Re-render with current filters
  const term = search.value.toLowerCase();
  const filteredEntries = filterEntries(term, currentCategory);
  renderEntries(filteredEntries);
}