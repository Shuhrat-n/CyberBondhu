// Switch between website pages

function showPage(pageId) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(function(page) {
        page.classList.add("hidden");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// Basic suspicious-message demonstration

function checkMessage() {

    const messageInput =
        document.getElementById("messageInput");

    const result =
        document.getElementById("result");

    const message = messageInput.value.trim();

    result.className = "result";

    if (message.length === 0) {

        result.textContent =
            "Please enter a message to check.";

        result.classList.add("warning");

        return;
    }


    const lowerMessage = message.toLowerCase();

    const warnings = [];


    // Rule 1: Urgent language

    const urgentWords = [
        "immediately",
        "urgent",
        "act now",
        "account will be blocked",
        "account suspended"
    ];

    if (urgentWords.some(word => lowerMessage.includes(word))) {

        warnings.push(
            "The message uses urgent language to pressure you."
        );

    }


    // Rule 2: Requests for sensitive information

    const sensitiveWords = [
        "share your otp",
        "send your otp",
        "enter your password",
        "verify your password",
        "send your pin"
    ];

    if (sensitiveWords.some(word => lowerMessage.includes(word))) {

        warnings.push(
            "The message may be asking for sensitive information."
        );

    }


    // Rule 3: Link included in the message

    if (/https?:\/\/|www\./i.test(message)) {

        warnings.push(
            "The message contains a web link. Check the website address carefully."
        );

    }


    // Display the results

    if (warnings.length > 0) {

        result.classList.add("warning");

        result.textContent =
            "⚠️ Possible warning signs found:\n\n" +
            warnings.map((warning, index) =>
                (index + 1) + ". " + warning
            ).join("\n\n") +
            "\n\nThis is not proof that the message is a scam. " +
            "Do not share passwords or OTPs, and verify unexpected " +
            "requests through an official channel.";

    } else {

        result.classList.add("safe");

        result.textContent =
            "No warning signs were detected by these basic rules. " +
            "This does not mean the message is safe. " +
            "Be careful with unexpected requests and unfamiliar links.";

    }

}


// Password vault information demonstration

// 1. We use Mock Data for now
let mockVaultData = [
    { id: 1, siteName: "Facebook", siteUrl: "https://facebook.com", accountUsername: "nakiba@example.com" },
    { id: 2, siteName: "Gmail", siteUrl: "https://mail.google.com", accountUsername: "nakiba.demo@gmail.com" }
];

// 2. Function to render (display) the passwords on the screen
function renderVault() {
    const vaultList = document.getElementById("vaultList");
    
    // Clear the "Loading..." text
    vaultList.innerHTML = "";

    if (mockVaultData.length === 0) {
        vaultList.innerHTML = "<p>No passwords saved yet.</p>";
        return;
    }

    // Loop through the data and create HTML for each item
    mockVaultData.forEach(item => {
        const div = document.createElement("div");
        div.className = "vault-item";
        
        div.innerHTML = `
            <div class="vault-info">
                <h3>${item.siteName}</h3>
                <p>${item.accountUsername}</p>
            </div>
            <button class="delete-btn" onclick="deleteVaultItem(${item.id})">Delete</button>
        `;
        
        vaultList.appendChild(div);
    });
}

// 3. Handle the form submission to add a new password
document.getElementById("addVaultForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Stop the page from reloading

    // Get the values from the form inputs
    const newSiteName = document.getElementById("siteName").value;
    const newSiteUrl = document.getElementById("siteUrl").value;
    const newUsername = document.getElementById("accountUsername").value;
    // (Password is ignored for now, Nakiba's encryption logic will handle it later)

    // Create a new object (simulating what will be sent to the database)
    const newEntry = {
        id: Date.now(), // Fake ID
        siteName: newSiteName,
        siteUrl: newSiteUrl,
        accountUsername: newUsername
    };

    // Add to our mock array
    mockVaultData.push(newEntry);
    
    // Re-render the list
    renderVault();

    // Clear the form
    this.reset();
    alert("Password saved successfully! (Mock)");
});

// 4. Handle deleting a password
function deleteVaultItem(id) {
    if (confirm("Are you sure you want to delete this password?")) {
        // Filter out the item with the matching ID
        mockVaultData = mockVaultData.filter(item => item.id !== id);
        renderVault();
    }
}

// 5. Initialize the vault when the page loads
// (This ensures the list shows up when you click the Vault tab)
window.addEventListener("DOMContentLoaded", renderVault);