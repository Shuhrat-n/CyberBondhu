chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Only check main frame navigation (not iframes)
    if (details.frameId === 0) {
        const targetUrl = details.url;

        try {
            // Call Spring Boot Backend
            const response = await fetch('http://localhost:8080/api/scam-check/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: targetUrl })
            });
            
            const result = await response.json();

            // If risk is Medium or High, inject the warning overlay
            if (result.riskLevel === "HIGH" || result.riskLevel === "MEDIUM") {
                chrome.scripting.executeScript({
                    target: { tabId: details.tabId },
                    func: showWarningOverlay,
                    args: [result]
                });
            }
        } catch (error) {
            console.error("CyberBondhu API Error:", error);
        }
    }
});

// This function gets injected into the page to render the popup
function showWarningOverlay(scanResult) {
    // Send message to content.js to render the UI
    window.postMessage({ type: "CYBERBONDHU_WARNING", data: scanResult }, "*");
}