# About This Repository

This repository contains sample code for building a Chrome extension that saves text from any website and provides AI generated summaries for later reference.

This extension is built using crx.js which helps building Chrome extensions using modern web technologies like React, TypeScript, and Webpack. Features like hot reloading, TypeScript support, and more are included out of the box. This repository however sticks with the basics to provide a simple example.

It uses the Chrome Storage API to save text data and the Groq API to generate summaries.

## Development Setup

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to build the extension.
4. Load the extension in Chrome by going to `chrome://extensions/`, enabling Developer mode, and loading the `dist` directory.

## For making your own extension

- **VanillaJS**:
  ```
      npm init vite@^2
      npm i @crxjs/vite-plugin -D
  ```
  Then make a `vite.config.js` with
  ```javascript
  import { defineConfig } from "vite";
  import { crx } from "@crxjs/vite-plugin";
  import manifest from "./manifest.json";

  export default defineConfig({
  	plugins: [crx({ manifest })],
  });
  ```
  Then make a manifest.json file. Done!
- **[Using react](https://dev.to/jacksteamdev/create-a-vite-react-chrome-extension-in-90-seconds-3df7)**

# General Chrome Extension Knowledge

Extensions use web technologies (HTML/CSS/JS) but have special capabilities through Chrome APIs.

Extensions are made up of a background script, content scripts, an options page, UI elements, and various other files.

## Key Components of an Extension

### Background Script

- Runs in the background and can listen for events like the extension being installed, updated, or having a message sent from a content script.

### Content Scripts

- Injected into web pages and can interact with the DOM of the page.

### Options Page

- A UI page that allows users to configure the extension.

### UI Elements

- Buttons, popups, and other elements that the user interacts with.

### Manifest File

- A JSON file that contains metadata about the extension like the name, version, permissions, and more.

## Core Concepts

### Service Workers

A script that runs in the background, separate from the main browser thread. They are event-driven and can intercept network requests, cache resources, and more. These can run in the background even when the extension is not active.

#### Usage

```javascript
// Register service worker
navigator.serviceWorker.register('service-worker.js');

// Listen for events in service worker
self.addEventListener('fetch', (event) => {
  // Handle fetch event
});

self.addEventListener('push', (event) => {
  // Handle push event
});

self.addEventListener('install', (event) => {
  // Handle install event
});

self.addEventListener('activate', (event) => {
  // Handle activate event
});

// serve from cache if available, otherwise fetch from the network and cache the response
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response; // Cache hit
      return fetch(event.request).then(networkResponse => {
        // Cache the response for future use
        caches.open('v1').then(cache => cache.put(event.request, networkResponse.clone()));
        return networkResponse;
      });
    })
  );
});

// Declare the service worker in manifest.json
"background": {
  "service_worker": "service-worker.js"
}
```

### Message Passing

Message passing is a core communication mechanism in Chrome extensions and web applications. It allows different parts of an extension (e.g., background script, content script, popup) or even different contexts (e.g., service worker and web page) to exchange data and coordinate actions.

**Why Message Passing?**

Isolation: Different parts of an extension run in separate contexts (e.g., content scripts run in the page's context, while background scripts run in the extension's context).

Security: Prevents direct access to sensitive data or APIs.

Coordination: Enables different components to work together.

Message Sender: The component sending the message.

Message Receiver: The component listening for messages.

Message Content: The data being passed (can be any JSON-serializable object).

Ports: For long-lived, two-way communication.

Example: One time messages - Popup -> Background Script

```javascript
// popup.js (Sender)
chrome.runtime.sendMessage({ action: "getData" }, response => {
	console.log("Received response:", response);
});

// background.js (Receiver)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "getData") {
		sendResponse({ data: "Hello from background!" });
	}
});
```

Example: Long-lived connection - Popup <-> Background Script

```javascript
// content-script.js (Sender)
const port = chrome.runtime.connect({ name: "content-script" });
port.postMessage({ action: "start" });

port.onMessage.addListener(message => {
	console.log("Received:", message);
});

// background.js (Receiver)
chrome.runtime.onConnect.addListener(port => {
	if (port.name === "content-script") {
		port.onMessage.addListener(message => {
			if (message.action === "start") {
				port.postMessage({ status: "connected" });
			}
		});
	}
});
```

Example: Cross-origin communication - Web Page <-> Content Script

```javascript
// web-page.js (Sender)
window.postMessage({ type: "FROM_PAGE", data: "Hello from page!" }, "*");

// content-script.js (Receiver)
window.addEventListener("message", event => {
	if (event.data.type === "FROM_PAGE") {
		console.log("Received from page:", event.data.data);
	}
});
```

### Content Scripts

Scripts that run in the context of web pages. They can modify the DOM, listen for events, inject custom styles, and interact with the page's content.

Example:

```javascript
// content-script.js
document.body.style.backgroundColor = "yellow";
chrome.runtime.sendMessage({ action: "pageModified" });
```

### Permissions

Permissions are required to access certain features or APIs in Chrome extensions. They are declared in the manifest file and must be granted by the user when installing the extension.

Host Permissions: Allow access to specific domains or URLs.

API Permissions: Allow access to specific Chrome APIs.

## Chrome APIs

Extensions can interact with Chrome APIs to access various features like tabs, storage, notifications, and more.

### Runtime: chrome.runtime

It manages extension lifecycle and cross-component communication. Extension lifecycle are events that occur when the extension is installed, updated, or uninstalled. Cross-component communication is when different parts of the extension need to communicate with each other, like the background script and content scripts. These would want to communicate to share data or trigger actions like opening a new tab, updating the extension's icon or sending a message to the user.

#### Cross-Component Communication

```javascript
// From popup.js
chrome.runtime.sendMessage({ action: "saveData", data: entry });

// In background.js
chrome.runtime.onMessage.addListener(message => {
	if (message.action === "saveData") {
		// Handle data
		const data = message.data;
		// ...
	}
});
```

### Scripting: chrome.scripting

It allows you to inject scripts into web pages. This is useful when you want to interact with the DOM of a web page or modify its behavior. For example, you could inject a script to extract text from a page, highlight certain elements, or add a button to the page.

It requires permissions to access - `"scripting"`, `"activeTab"`.

#### Injecting a Script

```javascript
chrome.scripting.executeScript({
	target: { tabId: tab.id },
	files: ["content-script.js"],
});

// Execute ad-hoc code
chrome.scripting.executeScript({
	target: { tabId: tab.id },
	func: () => {
		document.body.style.backgroundColor = "red";
	},
});
```

Example of content-script.js:

```javascript
const text = document.body.innerText;
chrome.storage.local.set({ text: text });
```

### Alarms: chrome.alarms

It allows you to schedule code to run at a specific time. This is useful when you want to periodically check for updates, sync data, or perform other tasks on a schedule.

It requires permissions to access - `"alarms"`.

#### Scheduling an Alarm

```javascript
chrome.alarms.create("refreshData", {
	periodInMinutes: 60,
});

// Handle alarms in background.js
chrome.alarms.onAlarm.addListener(alarm => {
	if (alarm.name === "refreshData") {
		fetchNewData();
	}
});
```

### Tabs: chrome.tabs

It allows you to interact with the browser tabs like opening, closing, and updating them. This is useful when you want to open a new tab, inject a script into a tab, or get information about the current tab.

It requires permissions to access - `"tabs"`.

#### Usage

```javascript
// Create new tab
chrome.tabs.create({ url: "https://example.com" });

// Get current tab
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
	const currentTab = tabs[0];
});

// Update tab URL
chrome.tabs.update(tabId, { url: newUrl });
```

### Storage: chrome.storage

It allows you to store and retrieve data in the browser. This is useful when you want to save user preferences, cache data, or store other information that needs to persist across sessions.

It requires permissions to access - `"storage"`.

#### Types of Storage

- `chrome.storage.local`: Data is stored locally and persists until cleared.
- `chrome.storage.sync`: Data is synced across devices if the user is signed in to Chrome.
- `chrome.storage.managed`: Data is set by the administrator of a managed device.
- `chrome.storage.session`: Data is stored per session and is cleared when the browser is closed.

#### Usage

```javascript
// Save data
chrome.storage.local.set({ key: value });

// Retrieve data
chrome.storage.local.get(["key"], result => {
	console.log(result.key);
});

// Sync across devices
chrome.storage.sync.set({ preferences: { darkMode: true } });
```

### Notifications: chrome.notifications

It allows you to show notifications to the user. This is useful when you want to alert the user about an event, display a message, or provide feedback.

It requires permissions to access - `"notifications"`.

#### Usage

```javascript
chrome.notifications.create("notificationId", {
	type: "basic",
	iconUrl: "icon.png",
	title: "Title",
	message: "Message",
});

// Handle notification click
chrome.notifications.onClicked.addListener(notificationId => {
	console.log("Notification clicked");
});
```

### Web Navigation: chrome.webNavigation

It allows you to listen for events like a page being loaded or updated. This is useful when you want to track the user's navigation, detect specific URLs, or perform actions based on page events.

It requires permissions to access - `"webNavigation"`.

#### Usage

```javascript
chrome.webNavigation.onCompleted.addListener(details => {
	if (details.url.includes("special-page")) {
		injectSpecialContent();
	}
});
```

### Commands: chrome.commands

It allows you to define keyboard shortcuts for your extension. This is useful when you want to provide quick access to features or actions without using the mouse.

#### Usage

```javascript
// Define shortcut in manifest.json
"commands": {
  "toggle-feature": {
    "suggested_key": {
      "default": "Ctrl+Shift+U",
      "mac": "Command+Shift+U"
    },
    "description": "Toggle feature"
  }
}

// Handle shortcut in background.js
chrome.commands.onCommand.addListener((command) => {
  if(command === 'toggle-feature') {
    toggleFeature();
  }
});
```

### Permissions: chrome.permissions

It allows you to request permissions to access certain features like tabs, storage, and more. This is useful when you need to access sensitive data or perform restricted actions.

#### Usage

```javascript
chrome.permissions.request(
	{
		origins: ["https://*.example.com/*"],
	},
	granted => {
		if (granted) {
			enablePremiumFeature();
		}
	}
);

// Check if permission is granted
chrome.permissions.contains(
	{
		origins: ["https://*.example.com/*"],
	},
	result => {
		if (result) {
			enablePremiumFeature();
		}
	}
);
```

### Web Request: chrome.webRequest

It allows you to intercept and modify network requests. This is useful when you want to block ads, modify headers, or redirect requests.

It requires permissions to access - `"webRequest"`.

#### Usage

```javascript
// Block ads
chrome.webRequest.onBeforeRequest.addListener(
	details => {
		if (details.url.includes("adserver")) {
			return { cancel: true }; // Block request
		}
	},
	{ urls: ["<all_urls>"] },
	["blocking"]
);

// Modify headers
chrome.webRequest.onBeforeSendHeaders.addListener(
	details => {
		details.requestHeaders.push({ name: "X-My-Header", value: "Value" });
		return { requestHeaders: details.requestHeaders };
	},
	{ urls: ["<all_urls>"] },
	["blocking", "requestHeaders"]
);
```

### Context Menus: chrome.contextMenus

It allows you to add items to the browser's context menu. This is useful when you want to provide additional actions or features when the user right-clicks on a page.

It requires permissions to access - `"contextMenus"`.

#### Usage

```javascript
// Create context menu item
chrome.contextMenus.create({
	id: "save-selection",
	title: "Save Selection",
	contexts: ["selection"],
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "save-selection") {
		saveSelection(info.selectionText);
	}
});
```

### Identity: chrome.identity

It allows you to authenticate users with OAuth2 and OpenID Connect. This is useful when you want to access user data from Google APIs or other services that require authentication.

It requires permissions to access - `"identity"`.

#### Usage

```javascript
// Get OAuth2 token
chrome.identity.getAuthToken({ interactive: true }, token => {
	fetch("https://api.example.com/data", {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
});

// Check if user is signed in
chrome.identity.getProfileUserInfo(userInfo => {
	if (userInfo.id) {
		console.log("User is signed in");
	}
});

// Sign out
chrome.identity.removeCachedAuthToken({ token: token });
```

### Cookies: chrome.cookies

It allows you to interact with cookies in the browser. This is useful when you want to read, write, or delete cookies for a specific domain.

It requires permissions to access - `"cookies"`.

#### Usage

```javascript
// Get cookies
chrome.cookies.get({ url: "https://example.com", name: "session" }, cookie => {
	console.log(cookie.value);
});

// Set cookie
chrome.cookies.set({
	url: "https://example.com",
	name: "session",
	value: "12345",
});

// Delete cookie
chrome.cookies.remove({ url: "https://example.com", name: "session" });
```

### Action: chrome.action

It allows you to change the extension's icon and handle clicks on the icon. This is useful when you want to provide quick access to features or actions without using the popup.

It requires permissions to access - `"action"`.

#### Usage

```javascript
// Define action in manifest.json
"action": {
  "default_popup": "popup.html",
  "default_icon": {
    "16": "images/icon16.png",
    "48": "images/icon48.png",
    "128": "images/icon128.png"
  }
}

// Handle action click in background.js
chrome.action.onClicked.addListener((tab) => {
  console.log('Action clicked');
});
```
