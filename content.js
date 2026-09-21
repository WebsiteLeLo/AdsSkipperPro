// content.js - Advanced Ads Skipper Pro
let isAttemptingSkip = false;
let widgetAdded = false;

// Aggressive matchers for shortener detection
const strongShortenerSelectors = [
    "#invisibleCaptchaShortlink", "#go-link", "form[action*='/links/go']", 
    "#wpsafe-link", "#wpsafe-t1", "#wpsafe-t2", "#makingdifferenttimer",
    "input[name='ad_form_data']", ".skip-btn",
    "button[onclick*='startV96Scanner']", "#v96-result",
    ".ai-rotate", ".code-block"
];

const buttonSelectors = [
    ...strongShortenerSelectors,
    "#skip-ad", "#get-link", ".get-link",
    "a.btn-success", "a.btn-primary", "a.btn-danger", "#continue", ".continue-btn", "button[id^='btn']", "a[id^='btn']",
    "a[href*='go.php']", "a[href*='?id=']", "#tp-box-btn",
    "button.btn-captcha"
];

const buttonKeywords = ["skip ad", "get link", "click here to continue", "verify endowment limits", "go to link", "verify now", "click to verify", "get url", "click here", "continue", "open link"];
const riskyKeywords = [];

function createWidget() {
    if (widgetAdded || document.getElementById('agy-skipper-widget')) return;
    
    const style = document.createElement('style');
    style.innerHTML = `
        #agy-skipper-widget {
            position: fixed; bottom: 24px; right: 24px; z-index: 2147483647 !important;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
            backdrop-filter: blur(12px); border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 12px; padding: 14px 20px; display: flex; align-items: center; gap: 14px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 248, 0.15);
            color: #f8fafc; font-family: 'Segoe UI', system-ui, sans-serif;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform: translateY(100px); opacity: 0; pointer-events: none;
            width: max-content;
        }
        #agy-skipper-widget.agy-show { transform: translateY(0); opacity: 1; pointer-events: auto; }
        
        .agy-spinner {
            width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.1);
            border-top-color: #38bdf8; border-radius: 50%;
            animation: agy-spin 1s linear infinite;
        }
        .agy-info { display: flex; flex-direction: column; text-align: left; }
        .agy-title { font-size: 12px; font-weight: 700; color: #38bdf8; margin: 0 0 2px 0; letter-spacing: 0.5px; text-transform: uppercase;}
        .agy-status { font-size: 13px; color: #cbd5e1; margin: 0; }
        
        @keyframes agy-spin { to { transform: rotate(360deg); } }
    `;
    
    const widget = document.createElement('div');
    widget.id = 'agy-skipper-widget';
    widget.innerHTML = `
        <div class="agy-spinner"></div>
        <div class="agy-info">
            <h3 class="agy-title">Ads Skipper Pro</h3>
            <p class="agy-status" id="agy-status-text">Detecting shortener...</p>
        </div>
    `;
    
    if (document.documentElement) {
        document.documentElement.appendChild(style);
        document.documentElement.appendChild(widget);
        widgetAdded = true;
    }
}

function showFullScreenWait(id, seconds, titleText, subtitleText, freezePage, onComplete) {
    if (freezePage) {
        // Freeze page interactions to stop background ads
        window.stop();
        const highestId = window.setInterval(() => {}, 1000);
        for (let i = 0; i < highestId; i++) window.clearInterval(i);
        
        const blockEvent = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
        ['click', 'mousedown', 'mouseup', 'keydown', 'keypress', 'keyup'].forEach(evt => {
            window.addEventListener(evt, blockEvent, true);
            document.addEventListener(evt, blockEvent, true);
        });
    }

    if (!document.getElementById('agy-fullscreen-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'agy-fullscreen-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(10px);
            z-index: 2147483647; display: flex; flex-direction: column;
            align-items: center; justify-content: center; color: white;
            font-family: 'Inter', system-ui, sans-serif; text-align: center; cursor: wait;
        `;
        
        const title = document.createElement('h1');
        title.id = 'agy-fullscreen-title';
        title.textContent = titleText;
        title.style.cssText = "font-size: 32px; font-weight: bold; margin-bottom: 20px; color: #3b82f6;";
        
        const subtitle = document.createElement('p');
        subtitle.textContent = subtitleText;
        subtitle.style.cssText = "font-size: 16px; max-width: 600px; line-height: 1.5; color: #94a3b8; margin-bottom: 40px;";
        
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'agy-fullscreen-timer';
        timerDisplay.style.cssText = "font-size: 80px; font-weight: 800; font-variant-numeric: tabular-nums; text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);";
        
        overlay.appendChild(title);
        overlay.appendChild(subtitle);
        overlay.appendChild(timerDisplay);
        
        overlay.addEventListener('click', blockEvent, true);
        if (document.body) {
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
        }
    }

    const storageKey = `agy-wait-${id}`;
    let endAt;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
        endAt = parseInt(stored, 10);
    } else {
        endAt = Date.now() + (seconds * 1000);
        sessionStorage.setItem(storageKey, endAt.toString());
    }

    const timerId = setInterval(() => {
        const remainingMs = endAt - Date.now();
        const display = document.getElementById('agy-fullscreen-timer');
        
        if (display) {
            if (remainingMs > 0) {
                const totalSeconds = remainingMs / 1000;
                const s = Math.floor(totalSeconds);
                const ms = Math.floor((remainingMs % 1000) / 10);
                display.textContent = `${s}.${ms.toString().padStart(2, '0')}`;
            } else {
                display.textContent = "0.00";
            }
        }
        
        if (remainingMs <= 0) {
            clearInterval(timerId);
            sessionStorage.removeItem(storageKey);
            const overlay = document.getElementById('agy-fullscreen-overlay');
            if (overlay) overlay.innerHTML = "<h1 style='font-size:40px; color:#10b981;'>Unlocking Access...</h1>";
            onComplete();
        }
    }, 16);
}

function showWidget(statusText) {
    createWidget();
    const widget = document.getElementById('agy-skipper-widget');
    const textEl = document.getElementById('agy-status-text');
    if (widget && textEl) {
        widget.classList.add('agy-show');
        if (statusText) textEl.innerText = statusText;
    }
}

function updateWidget(statusText, showTimer = false) {
    const textEl = document.getElementById('agy-status-text');
    if (textEl) {
        textEl.innerText = statusText;
    }
}

let secondsWaited = 0;
function updateTimerUI() {
    const textEl = document.getElementById('agy-status-text');
    if (textEl && textEl.innerText.includes("Bypassing")) {
        secondsWaited++;
        if (secondsWaited <= 15) {
            textEl.innerText = `Bypassing timers... (${15 - secondsWaited}s)`;
        } else {
            textEl.innerText = `Finalizing bypass...`;
        }
    }
}

function bypassAdClickWait() {
    window.dispatchEvent(new Event('blur'));
    setTimeout(() => window.dispatchEvent(new Event('focus')), 150);
    
    // Aggressively remove ad-click modals
    document.querySelectorAll('div').forEach(overlay => {
        if (overlay.id === 'agy-skipper-widget' || overlay.id === 'agy-skipper-overlay' || !overlay.innerText) return;
        
        let text = overlay.innerText.toLowerCase();
        if ((text.includes("click on the ad") && text.includes("15 seconds")) || text.includes("click image to continue")) {
            const modalWrapper = overlay.closest('div[style*="fixed"], div[style*="absolute"], div.modal, div.overlay') || overlay;
            modalWrapper.style.display = 'none';
        }
    });
}

function revealHiddenButtons() {
    document.querySelectorAll('a, button, div.btn').forEach(el => {
        if (window.getComputedStyle(el).display === 'none' || el.classList.contains('hidden') || el.classList.contains('d-none')) {
            let text = el.innerText.trim().toLowerCase();
            if (buttonKeywords.some(keyword => text.includes(keyword)) || riskyKeywords.some(keyword => text.includes(keyword)) || el.id.includes("wpsafe")) {
                el.style.setProperty('display', 'inline-block', 'important');
                el.style.setProperty('visibility', 'visible', 'important');
                el.style.setProperty('opacity', '1', 'important');
                el.classList.remove('hidden', 'd-none');
                el.disabled = false;
            }
        }
    });
}

async function attemptSkip() {
    if (isAttemptingSkip) return false;

    // Fast Strategy: External Links near v96 result block (hittracks / v96 style)
    const extLinks = document.querySelectorAll('#v96-result ~ div a, #v96-result ~ p a');
    for (const link of extLinks) {
        if (link.href && !link.href.includes(window.location.hostname) && !link.href.startsWith('javascript:') && !link.href.includes('google.com') && !link.href.includes('doubleclick')) {
            isAttemptingSkip = true;
            updateWidget("Destination found! Redirecting...");
            window.location.href = link.href;
            return true;
        }
    }

    // Strategy 1: Find finalDestinationUrl in scripts
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
        if (script.innerHTML.includes('finalDestinationUrl') || script.innerHTML.includes('safelink')) {
            const match = script.innerHTML.match(/(?:finalDestinationUrl|safelinkUrl|redirectUrl)\s*=\s*['"]([^'"]+)['"]/i);
            if (match && match[1]) {
                let finalUrl = match[1].replace(/\\\//g, '/');
                if (finalUrl.startsWith('http')) {
                    isAttemptingSkip = true;
                    updateWidget("Found JS destination! Redirecting...");
                    window.location.href = finalUrl;
                    return true;
                }
            }
        }
    }

    // Strategy 2: AdLinkFly / Arolinks Final Page (#go-link API Fetch)
    const goLinkForm = document.querySelector('#go-link, form[action*="/links/go"]');
    if (goLinkForm) {
        // Let Strategy 4 generic clicker handle it when it's natively ready
        // API Fetch is too brittle due to dynamically loaded CSRF tokens/Turnstile
    }

    // Strategy 3: WPSafeLink hidden links
    const hiddenUrl = document.querySelector('input[name="url"], input[name="link"], #wpsafe-link a, #wpsafe-t1 a, #wpsafe-t2 a');
    if (hiddenUrl) {
        if (hiddenUrl.tagName === 'INPUT' && hiddenUrl.value && hiddenUrl.value.startsWith('http')) {
            isAttemptingSkip = true;
            updateWidget("Found hidden URL! Redirecting...");
            window.location.href = hiddenUrl.value;
            return true;
        } else if (hiddenUrl.tagName === 'A' && hiddenUrl.href && !hiddenUrl.href.startsWith('javascript:')) {
            isAttemptingSkip = true;
            updateWidget("Found hidden Link! Redirecting...");
            window.location.href = hiddenUrl.href;
            return true;
        }
    }

    // Strategy 4: Fallback to aggressive button clicks
    bypassAdClickWait();
    revealHiddenButtons();

    const isArolinkDomain = window.location.hostname.includes("arolink") || window.location.hostname.includes("entiredust") || window.location.hostname.includes("hittracks");

    for (const selector of buttonSelectors) {
        for (const element of document.querySelectorAll(selector)) {
            if (element && window.getComputedStyle(element).display !== 'none' && !element.disabled && !element.dataset.agyClicked) {
                
                if (isArolinkDomain && !window.agyArolinkStarted) {
                    window.agyArolinkStarted = true;
                    showFullScreenWait("arolinks", 10, "Bypassing Arolinks...", "Waiting 10 seconds to satisfy the server's anti-bot verification before proceeding to the next step.", false, () => {
                        element.dataset.agyClicked = "true";
                        element.click();
                        if (element.tagName.toLowerCase() === 'a' && element.href && !element.href.startsWith('javascript:') && element.href !== window.location.href && !element.href.endsWith('#')) {
                            window.location.href = element.href;
                        }
                    });
                    return true;
                }
                
                element.dataset.agyClicked = "true";
                element.click();
                if (element.tagName.toLowerCase() === 'a' && element.href && !element.href.startsWith('javascript:') && element.href !== window.location.href && !element.href.endsWith('#')) {
                     window.location.href = element.href;
                }
                return true; // Clicked something, wait 1s
            }
        }
    }
    
    const elements = document.querySelectorAll("a, button, div.btn");
    for (let el of elements) {
        let text = el.innerText.trim().toLowerCase();
        
        // Skip obvious ad links to prevent opening multiple ad tabs
        if (el.tagName === 'A' && el.href && (el.href.includes('doubleclick') || el.href.includes('googleads') || el.href.includes('taboola') || el.href.includes('outbrain'))) {
            continue;
        }

        // Check for image buttons (very common on Tipsguru and WPSafeLink)
        const img = el.querySelector('img');
        if (img) {
            text += " " + (img.alt || "").toLowerCase() + " " + (img.src || "").toLowerCase();
        }

        if (buttonKeywords.some(keyword => text.includes(keyword))) {
            if (window.getComputedStyle(el).display !== 'none' && !el.dataset.agyClicked) {
                // Do NOT forcefully enable disabled buttons on Arolinks, it causes premature API fetches which fail.
                if (el.disabled) {
                    if (isArolinkDomain) {
                        return false; // Wait naturally for the site's own script to enable the button
                    }
                    // For other sites, aggressively force bypass fake UI timers
                    el.disabled = false;
                    el.classList.remove('disabled');
                }
                
                if (isArolinkDomain && !window.agyArolinkStarted) {
                    window.agyArolinkStarted = true;
                    showFullScreenWait("arolinks", 10, "Bypassing Arolinks...", "Waiting 10 seconds to satisfy the server's anti-bot verification before proceeding to the next step.", false, () => {
                        el.dataset.agyClicked = "true";
                        el.click();
                        if (el.tagName.toLowerCase() === 'a' && el.href && !el.href.startsWith('javascript:') && el.href !== window.location.href && !el.href.endsWith('#')) {
                            window.location.href = el.href;
                        }
                    });
                    return true;
                }
                
                el.dataset.agyClicked = "true";
                el.click();
                if (el.tagName.toLowerCase() === 'a' && el.href && !el.href.startsWith('javascript:') && el.href !== window.location.href && !el.href.endsWith('#')) {
                    window.location.href = el.href;
                }
                return true; // Clicked something, wait 1s
            }
        }
    }

    return false;
}

function isShortenerPage() {
    // Check if URL has query params usually used by shorteners
    if (window.location.search.includes('?id=') || window.location.pathname.length > 20) return true;
    
    // Check for obvious shortener DOM elements
    if (strongShortenerSelectors.some(sel => document.querySelector(sel))) return true;
    
    // Check if page text heavily implies a shortener
    let text = document.body.innerText.toLowerCase();
    if (text.includes("please wait") && (text.includes("second") || text.includes("skip ad") || text.includes("get link"))) {
        return true;
    }
    return false;
}

function handleGoogleSearch() {
    if (!window.location.hostname.includes("google.")) return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    const query = (urlParams.get('q') || "").toLowerCase();
    
    // Check if the query looks like a shortener search task
    const knownShortenerQueries = ["tipsguru", "hittracks", "wpsafelink", "arolinks", "vplink", "gplinks", "shrinke"];
    
    if (knownShortenerQueries.some(q => query.includes(q))) {
        showWidget("Found search task! Finding target link...");
        
        const searchResults = document.querySelectorAll('#search a');
        for (const link of searchResults) {
            let href = link.href.toLowerCase();
            // Find the first organic result that is NOT a google or youtube service
            if (href && href.startsWith("http") && !href.includes("google.") && !href.includes("youtube.com")) {
                updateWidget("Clicking target search result...");
                window.location.href = link.href;
                return true;
            }
        }
    }
    return false;
}

function bypassWPSafeLink() {
    if (window.location.hostname.includes("tipsguru") || window.location.hostname.includes("vidyarays") || window.location.hostname.includes("mineverse")) {
        const STORAGE_KEY = "agy-tipsguru-wait";
        
        // 1. Check if we already have a wait session running
        let sessionData = null;
        try {
            const dataStr = sessionStorage.getItem(STORAGE_KEY);
            if (dataStr) sessionData = JSON.parse(dataStr);
        } catch(e) {}
        
        if (sessionData && sessionData.dest && typeof sessionData.endAt === 'number') {
            const timeLeft = sessionData.endAt - Date.now();
            if (timeLeft <= 0) {
                sessionStorage.removeItem(STORAGE_KEY);
                showWidget("Opening access...");
                window.location.replace(sessionData.dest);
                return true;
            } else {
                // Keep the user parked on the homepage so they aren't confused by random posts
                if (window.location.pathname !== '/') {
                    window.location.replace(window.location.origin + '/');
                    return true;
                }
                
                // Show reusable fullscreen wait
                if (!window.agyTipsguruWaitStarted) {
                    window.agyTipsguruWaitStarted = true;
                    const remainingSeconds = Math.max(0, (sessionData.endAt - Date.now()) / 1000);
                    showFullScreenWait("tipsguru", remainingSeconds, "Bypassing TipsGuru...", "TipsGuru forces a 4-minute wait on their server before releasing the final link. We are waiting it out automatically so you don't have to click through 6 steps.", true, () => {
                        sessionStorage.removeItem(STORAGE_KEY);
                        window.location.replace(sessionData.dest);
                    });
                }
                
                return true;
            }
        }

        // 2. Try to fetch the destination if no session exists
        if (!window.agyTipsguruFetched) {
            window.agyTipsguruFetched = true;
            
            new Promise(resolve => {
                if (window.location.pathname.includes('prolink.php')) {
                    const id = new URLSearchParams(window.location.search).get("id");
                    if (id) {
                        try {
                            const url = atob(decodeURIComponent(id).trim());
                            if (url.startsWith('http')) return resolve(url);
                        } catch(e) {}
                    }
                }
                
                const finalUrlMatch = /"finalUrl"\s*:\s*"([^"]+)"/.exec(document.documentElement.innerHTML);
                if (finalUrlMatch && finalUrlMatch[1]) {
                    const url = finalUrlMatch[1].replace(/\\\//g, "/");
                    if (url.startsWith('http')) return resolve(url);
                }
                
                chrome.runtime.sendMessage({type: "TIPSGURU_GET_DEST"}, (response) => {
                    resolve(response?.url || null);
                });
            }).then(destUrl => {
                if (destUrl) {
                    // Exact logic from example-extension: 252 seconds server wait
                    const endAt = Date.now() + 252000;
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ dest: destUrl, endAt }));
                    
                    if (window.location.pathname !== '/') {
                        window.location.replace(window.location.origin + '/');
                    } else {
                        window.location.reload();
                    }
                }
            });
        }
        return true; // Block default bypass
    }

    return false;
}

function runGenericBypass() {
    if (handleGoogleSearch()) return; // Stop if we're doing a Google Search auto-click


    // Only show the UI overlay if this is definitely a shortener page to avoid annoying users on simple sites
    if (isShortenerPage()) {
        showWidget("Bypassing timers & ads...");
    }

    // Attempt immediately
    if (bypassWPSafeLink()) return;
    attemptSkip();
    
    // Check every second to progress the bypass workflow
    setInterval(async () => {
        if (!isAttemptingSkip) {
            if (bypassWPSafeLink()) return; // Try deep bypass first
            
            let skipped = await attemptSkip();
            if (skipped && !widgetAdded) {
                showWidget("Progressing to next step...");
            } else if (!skipped && widgetAdded) {
                updateTimerUI();
            }
        }
    }, 1000);
}

// Start Bypasser
async function init() {
    let host = window.location.hostname;
    if (isShortenerPage()) {
        console.log("Ads Skipper Pro: Active on " + host + " (Heuristic match)");
        runGenericBypass();
    } else {
        console.log("Ads Skipper Pro: Inactive on " + host);
    }
}

// Ensure execution waits for document to be ready, but inject fast if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
