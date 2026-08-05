chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openExtensionPopup") {
        chrome.action.openPopup();
    }
});