// Set the side panel to open when its action button is clicked.
chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch(error => console.error(error));

// Listen for the extension installation event.
chrome.runtime.onInstalled.addListener(() => {
	// Create a context menu item for saving selected text.
	chrome.contextMenus.create({
		id: "saveText",
		title: "Save Text to Your Library",
		contexts: ["selection"],
	});
});

// Listen for clicks on the context menu item.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	// Check if the clicked item is the "Save Text" item and if text is selected.
	if (info.menuItemId === "saveText" && info.selectionText) {
		try {
			// Get the URL and page title of the current tab using script injection.
			const [result] = await chrome.scripting.executeScript({
				target: { tabId: tab.id },
				func: () => ({
					url: location.href,
					pageTitle: document.title,
				}),
			});

			// Create a popup window to get the title and category from the user.
			chrome.windows.create(
				{
					url: chrome.runtime.getURL("dialog/dialog.html"),
					type: "popup",
					width: 400,
					height: 300,
					left: 200,
					top: 200,
				},
				async window => {
					chrome.runtime.onMessage.addListener(function listener(message, sender, sendResponse) {
						console.log("Received message:", message);
						if (message.type === "getCategories") {
							chrome.storage.local.get({ entries: [] }, data => {
								const uniqueCategories = new Set(data.entries.map(entry => entry.category));
								sendResponse({ categories: [...uniqueCategories] });
							});
						}

						if (message.type === "saveData" && message.data) {
							const entry = {
								title: message.data.title,
								text: info.selectionText.trim(),
								url: result.result.url,
								category: message.data.category || "General",
								timestamp: Date.now(),
							};

							chrome.storage.local.get({ entries: [] }, data => {
								const entries = [entry, ...data.entries];
								chrome.storage.local.set({ entries }, () => {
									chrome.windows.remove(window.id);
								});
							});
							chrome.runtime.onMessage.removeListener(listener);
						}
						return true;
					});
				}
			);
		} catch (error) {
			// Handle any errors during the saving process.
			console.error("Error saving text:", error);
		}
	}
});
