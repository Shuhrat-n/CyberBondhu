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

function showVaultInfo() {

    const message =
        document.getElementById("vaultMessage");

    message.textContent =
        "The planned vault will protect saved credentials " +
        "using encryption. Real password storage is not " +
        "implemented in this prototype.";

}