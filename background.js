// for side panel
chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch(error => console.error(error));

// Updated background.js
chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "saveText",
		title: "Save Text to Your Library",
		contexts: ["selection"],
	});
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (info.menuItemId === "saveText" && info.selectionText) {
		try {
			const [result] = await chrome.scripting.executeScript({
				target: { tabId: tab.id },
				func: () => ({
					url: location.href,
					pageTitle: document.title,
				}),
			});

			// Use chrome.windows.create instead of prompt
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
					chrome.runtime.onMessage.addListener(function listener(message) {
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
						}
						chrome.runtime.onMessage.removeListener(listener);
					});
				}
			);
		} catch (error) {
			console.error("Error saving text:", error);
		}
	}
});
