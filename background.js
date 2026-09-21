// background.js - Service Worker
console.log("🛡️ Advanced Bypasser: Background Worker Started");

// Load our rules map (Obsolete: logic moved to content.js)

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === 'TIPSGURU_GET_DEST') {
        const url = sender.tab ? sender.tab.url : null;
        if (!url) {
            sendResponse({ url: null });
            return true;
        }

        chrome.cookies.getAll({ url: url }, cookies => {
            if (chrome.runtime.lastError || !cookies || !cookies.length) {
                sendResponse({ url: null });
                return;
            }

            // The example extension looks through cookies to find the decoded URL
            for (const cookie of cookies) {
                // Ignore standard tracking/session cookies
                if (cookie.name.toLowerCase().includes("session") || cookie.name.toLowerCase().includes("cf_") || cookie.name.toLowerCase().includes("google")) continue;
                
                try {
                    // Tipsguru stores the URL in base64 in a cookie
                    const decoded = atob(decodeURIComponent(cookie.value).trim());
                    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
                        sendResponse({ url: decoded });
                        return;
                    }
                } catch (e) {
                    try {
                        const decoded2 = atob(cookie.value.trim());
                        if (decoded2.startsWith("http://") || decoded2.startsWith("https://")) {
                            sendResponse({ url: decoded2 });
                            return;
                        }
                    } catch (e2) {}
                }
            }
            sendResponse({ url: null });
        });
        return true; // async response
    }
    
    return true; 
});

// IMPORTANT FIX: We completely removed the `declarativeNetRequest` Ad-Blocker.
// Why? Because sites like WPSafeLink/Safelink require you to click a Google Ad to proceed.
// If we block the ads at the network level, the site's "Click image to continue" script breaks entirely 
// and the final button never appears. 

// Clear any old blocking rules just in case they are stuck in the browser.
chrome.declarativeNetRequest.getDynamicRules().then((rules) => {
    const ruleIds = rules.map(rule => rule.id);
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
    });
});
