chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CYBERBONDHU_WARNING") {
        renderWarning(message.data);
    }
});

function renderWarning(result) {
    // Prevent multiple overlays
    if (document.getElementById("cyberbondhu-overlay")) return;

    // Setup our data (handling both our backend format and potential fallbacks)
    const explanations = Array.isArray(result.explanations) ? result.explanations : [];
    const phrases = Array.isArray(result.flaggedPhrases) ? result.flaggedPhrases : [];

    // Build the explanation HTML
    let explanationHTML = "";
    
    if (explanations.length === 0) {
        explanationHTML = `
            <div class="cb-reason">
                <p><strong>English:</strong> This link looks suspicious and may be trying to steal your information.</p>
                <p><strong>বাংলা:</strong> এই লিংকটি সন্দেহজনক এবং আপনার তথ্য চুরি করার চেষ্টা করতে পারে।</p>
            </div>`;
    } else {
        explanations.forEach(exp => {
            // YOUR backend returns a string, so we print it directly
            explanationHTML += `
                <div class="cb-reason">
                    <p><strong>⚠️ Reason:</strong> ${exp}</p>
                </div>`;
        });
    }

    // Build the flagged phrases HTML (if any)
    const triggerHTML = phrases.length
        ? `<p class="cb-trigger"><strong>Suspicious words found:</strong> ${phrases.join(", ")}</p>`
        : "";

    // Create the Overlay
    const overlay = document.createElement("div");
    overlay.id = "cyberbondhu-overlay";
    overlay.innerHTML = `
        <div class="cb-warning-box">
            <h1 class="cb-title">⚠️ Warning / সাবধান</h1>
            <h2 class="cb-subtitle">This link is unsafe. / এই লিংকটি নিরাপদ নয়।</h2>
            
            <div class="cb-explanation-container">
                <h3>Why is this dangerous? / এটি কেন বিপজ্জনক?</h3>
                ${explanationHTML}
                ${triggerHTML}
            </div>

            <div class="cb-actions">
                <button id="cb-safe-btn" class="cb-btn cb-safe">Go Back to Safety / নিরাপদে ফিরে যান</button>
                <button id="cb-proceed-btn" class="cb-btn cb-danger">I understand the risk, proceed</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    // Button Listeners
    document.getElementById("cb-safe-btn").addEventListener("click", () => {
        window.history.back();
    });

    document.getElementById("cb-proceed-btn").addEventListener("click", () => {
        overlay.remove();
        document.body.style.overflow = "auto";
    });
}