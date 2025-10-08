// todo: import * as chrome from '@vitest/browser/context';
//  adding this shows 'Unresolved variable onCommand' . whats the right approach for typing?

chrome.commands.onCommand.addListener(async (command) => {
	if (command === 'save-bookmark') {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

		chrome.windows.create({
			url: `https://breader.app/quick-add?url=${encodeURIComponent(tab.url)}&title=${encodeURIComponent(tab.title)}`,
			type: 'popup',
			width: 400,
			height: 500,
			focused: true
		});
	}
});
