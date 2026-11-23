chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CYBERBONDHU_WARNING") {
        renderWarning(message.data);
    }
});

function renderWarning(result) {
    // Prevent multiple overlays
    if (document.getElementById("cyberbondhu-overlay")) return;

    // Format bilingual explanations
    let explanationHTML = "";
    result.explanations.forEach(exp => {
        explanationHTML += `
            <div class="cb-reason">
                <p><strong>English:</strong> ${exp.en}</p>
                <p><strong>বাংলা:</strong> ${exp.bn}</p>
            </div>
        `;
    });

    const overlay = document.createElement("div");
    overlay.id = "cyberbondhu-overlay";
    overlay.innerHTML = `
        <div class="cb-warning-box">
            <h1 class="cb-title">⚠️ Warning / সাবধান</h1>
            <h2 class="cb-subtitle">This link is unsafe. / এই লিংকটি নিরাপদ নয়।</h2>
            
            <div class="cb-explanation-container">
                <h3>Why is this dangerous? / এটি কেন বিপজ্জনক?</h3>
                ${explanationHTML}
                <p class="cb-trigger"><strong>Suspicious words found:</strong> ${result.matchedPhrases.join(", ")}</p>
            </div>

            <div class="cb-actions">
                <button id="cb-safe-btn" class="cb-btn cb-safe">Go Back to Safety / নিরাপদে ফিরে যান</button>
                <button id="cb-proceed-btn" class="cb-btn cb-danger">I understand the risk, proceed</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Stop page scroll
    document.body.style.overflow = "hidden";

    // Button Listeners
    document.getElementById("cb-safe-btn").addEventListener("click", () => {
        window.history.back(); // Take the user back to the previous safe page
    });

    document.getElementById("cb-proceed-btn").addEventListener("click", () => {
        document.body.removeChild(overlay);
        document.body.style.overflow = "auto";
    });
}