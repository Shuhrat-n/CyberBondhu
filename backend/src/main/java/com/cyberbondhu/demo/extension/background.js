chrome.webNavigation.onCommitted.addListener(async (details) => {
    // Only check main frame
    if (details.frameId !== 0) return;

    const targetUrl = details.url;

    // Ignore internal pages
    if (targetUrl.startsWith("chrome://") || targetUrl.startsWith("edge://")) return;

    try {
        const response = await fetch('http://localhost:8080/api/scam/check', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: targetUrl, lang: "en" })
        });
        
        const result = await response.json();

        if (result.riskLevel === "HIGH" || result.riskLevel === "MEDIUM") {
            console.log("⚠️ Risk detected! Waiting for page to load to inject...");

            setTimeout(() => {
                chrome.scripting.insertCSS({
                    target: { tabId: details.tabId },
                    files: ["warning.css"]
                }).catch(err => console.log("CSS inject error:", err));

                chrome.scripting.executeScript({
                    target: { tabId: details.tabId },
                    files: ["content.js"]
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.log("Script inject error:", chrome.runtime.lastError.message);
                        return;
                    }
                    chrome.tabs.sendMessage(details.tabId, { 
                        type: "CYBERBONDHU_WARNING", 
                        data: result 
                    });
                });
            }, 500); 
        }
    } catch (error) {
        console.error("CyberBondhu API Error:", error);
    }
});