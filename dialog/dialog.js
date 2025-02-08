function fetchCategories() {
	chrome.runtime.sendMessage({ type: "getCategories" }, response => {
		// console.log("response from service worker: ", response);
		if (response && response.categories) {
			const categorySelect = document.getElementById("category");
			response.categories.forEach(category => {
				const option = document.createElement("option");
				option.value = category;
				option.textContent = category;
				categorySelect.appendChild(option);
			});
		}
	});
}

// Call fetchCategories on page load
document.addEventListener("DOMContentLoaded", fetchCategories);

document.getElementById("save").addEventListener("click", () => {
	const title = document.getElementById("title").value;
	let category = document.getElementById("category").value;
	const newCategory = document.getElementById("new-category").value;

	if (newCategory) {
		category = newCategory;
	}

	if (title) {
		console.log("title: ", title);
		chrome.runtime.sendMessage(
			{
				type: "saveData",
				data: { title, category },
			},
			response => {
				if (chrome.runtime.lastError) {
					console.error("Error sending message:", chrome.runtime.lastError.message);
				} else {
					console.log("Message sent successfully:", response);
				}
			}
		);
	}
});

document.getElementById("new-category").addEventListener("input", () => {
	const newCategory = document.getElementById("new-category").value;
	const categorySelect = document.getElementById("category");
	categorySelect.disabled = newCategory.length > 0;
});
