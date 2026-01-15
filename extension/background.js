// todo: import * as chrome from '@vitest/browser/context';
//  adding this shows 'Unresolved variable onCommand' . whats the right approach for typing?

// Common function to open quick-add popup with current page
async function saveCurrentPageToBreader() {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

	chrome.windows.create({
		url: `https://breader.app/quick-add?url=${encodeURIComponent(tab.url)}&title=${encodeURIComponent(tab.title)}`,
		type: 'popup',
		width: 400,
		height: 500,
		focused: true
	});
}

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: 'save-to-breader',
		title: 'Save to Breader',
		contexts: ['page']
	});
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info) => {
	if (info.menuItemId === 'save-to-breader') {
		saveCurrentPageToBreader();
	}
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
	if (command === 'save-bookmark') {
		saveCurrentPageToBreader();
	}
});
