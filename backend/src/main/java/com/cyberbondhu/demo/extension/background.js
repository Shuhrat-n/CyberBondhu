function sendWarning(tabId, data, attempts = 5) {
    chrome.tabs.sendMessage(tabId, { type: "CYBERBONDHU_WARNING", data }, () => {
        if (chrome.runtime.lastError && attempts > 0) {
            setTimeout(() => sendWarning(tabId, data, attempts - 1), 300);
        }
    });
}

chrome.webNavigation.onCommitted.addListener(async (details) => {
    // Only check main frame
    if (details.frameId !== 0) return;

    const targetUrl = details.url;
        // Ignore local development URLs
    if (targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1")) {
        console.log("Ignoring local dev URL:", targetUrl);
        return; 
    }

    // Ignore internal pages
    if (targetUrl.startsWith("chrome://") || targetUrl.startsWith("edge://")) return;

    try {
        const response = await fetch('http://localhost:8080/api/scam/check', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: targetUrl, lang: "en" })
        });

        const result = await response.json();
        console.log("API result:", result); // useful for checking field names

        if (result.riskLevel === "HIGH" || result.riskLevel === "MEDIUM") {
            console.log("⚠️ Risk detected! Sending warning to tab...");
            sendWarning(details.tabId, result);
        }
    } catch (error) {
        console.error("CyberBondhu API Error:", error);
    }
});