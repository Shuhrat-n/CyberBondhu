
// ============================================
// CYBERBONDHU - MAIN JAVASCRIPT
// ============================================

// ---------- PAGE NAVIGATION ----------

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
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


// ============================================
// VAULT CONFIGURATION
// ============================================

// Demo configuration from the existing project.
// Replace these with the authenticated user's details
// when the login flow is connected to the UI.

const CURRENT_USER_ID = 1;
const API_BASE_URL = "http://localhost:8080/api/vault";
const AUTH_URL = "http://localhost:8080/api/auth";

let jwtToken = null;
let currentVaultData = [];


// ---------- API HELPER ----------

async function apiRequest(url, options = {}) {
    if (!jwtToken) {
        throw new Error("Please log in before using the Password Vault.");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            "Authorization": `Bearer ${jwtToken}`
        }
    });

    if (!response.ok) {
        let message = "Something went wrong.";

        try {
            const errorData = await response.json();
            message = errorData.error || errorData.message || message;
        } catch (_) {
            message = response.statusText || message;
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}


// ---------- LOGIN ----------

async function autoLogin() {
    const vaultList = document.getElementById("vaultList");

    try {
        if (vaultList) {
            vaultList.textContent = "Connecting to your Password Vault...";
        }

        const response = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: "nakiba.demo@example.com",
                password: "Nakiba@Demo1"
            })
        });

        if (!response.ok) {
            throw new Error("Login failed. Please check the backend.");
        }

        const data = await response.json();

        if (!data.token) {
            throw new Error("The server did not return an authentication token.");
        }

        jwtToken = data.token;

        await loadVaultEntries();

    } catch (error) {
        console.error("Login error:", error);

        if (vaultList) {
            vaultList.textContent =
                "Unable to connect. Please make sure the backend is running.";
        }
    }
}


// ============================================
// PASSWORD VAULT - READ
// ============================================

async function loadVaultEntries() {
    const vaultList = document.getElementById("vaultList");

    if (!vaultList) return;

    vaultList.textContent = "Loading your saved passwords...";

    try {
        const data = await apiRequest(
            `${API_BASE_URL}/user/${CURRENT_USER_ID}`
        );

        if (!Array.isArray(data)) {
            throw new Error("Unexpected response from the server.");
        }

        currentVaultData = data;
        vaultList.replaceChildren();

        if (data.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent =
                "You have not saved any passwords yet.";

            vaultList.appendChild(emptyMessage);
            return;
        }

        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "vault-item";

            const info = document.createElement("div");
            info.className = "vault-info";

            const heading = document.createElement("h3");
            heading.textContent = item.siteName;

            const website = document.createElement("p");
            website.textContent = `Website: ${item.siteUrl}`;

            const username = document.createElement("p");
            username.textContent =
                `Username: ${item.accountUsername}`;

            const passwordLine = document.createElement("p");

            const passwordLabel = document.createElement("strong");
            passwordLabel.textContent = "Password: ";

            const passwordSpan = document.createElement("span");
            passwordSpan.id = `pass-${item.entryId}`;
            passwordSpan.className = "password-hidden";
            passwordSpan.textContent = "••••••••";

            passwordLine.append(passwordLabel, passwordSpan);

            info.append(heading, website, username, passwordLine);

            const actions = document.createElement("div");
            actions.className = "vault-actions";

            const viewButton = document.createElement("button");
            viewButton.type = "button";
            viewButton.className = "view-btn";
            viewButton.textContent = "Show password";
            viewButton.addEventListener("click", () => {
                toggleView(item.entryId, viewButton);
            });

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "edit-btn";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => {
                editVaultItem(item.entryId);
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => {
                deleteVaultItem(item.entryId);
            });

            actions.append(viewButton, editButton, deleteButton);
            card.append(info, actions);
            vaultList.appendChild(card);
        });

    } catch (error) {
        console.error("Vault loading error:", error);
        vaultList.textContent = error.message;
    }
}


// ============================================
// PASSWORD VAULT - ENCRYPTION DATA FORMAT
// ============================================

// Supports both:
// New format: separate salt, IV and ciphertext
// Old format: salt:ciphertext stored in encryptedPassword

function getEncryptionParts(item) {
    if (item.salt) {
        return {
            salt: item.salt,
            iv: item.iv,
            ciphertext: item.encryptedPassword
        };
    }

    // Compatibility with older project records
    if (item.encryptedPassword &&
        item.encryptedPassword.includes(":")) {

        const separator = item.encryptedPassword.indexOf(":");

        return {
            salt: item.encryptedPassword.substring(0, separator),
            iv: item.iv,
            ciphertext: item.encryptedPassword.substring(separator + 1)
        };
    }

    throw new Error("This saved entry has incomplete encryption information.");
}


// ============================================
// PASSWORD VAULT - SHOW / HIDE PASSWORD
// ============================================

async function toggleView(entryId, button) {
    const passSpan = document.getElementById(`pass-${entryId}`);

    if (!passSpan || !button) return;

    // Hide the password if it is already visible
    if (!passSpan.classList.contains("password-hidden")) {
        passSpan.textContent = "••••••••";
        passSpan.classList.add("password-hidden");
        button.textContent = "Show password";
        return;
    }

    const item = currentVaultData.find(
        entry => entry.entryId === entryId
    );

    if (!item) return;

    const masterPassword = prompt(
        "Enter your Master Password to unlock this password:"
    );

    if (masterPassword === null || masterPassword === "") {
        return;
    }

    try {
        const encryptedParts = getEncryptionParts(item);

        const decryptedData = await decryptData(
            encryptedParts,
            masterPassword
        );

        if (typeof decryptedData.password !== "string") {
            throw new Error("Password information is not in the expected format.");
        }

        passSpan.textContent = decryptedData.password;
        passSpan.classList.remove("password-hidden");
        button.textContent = "Hide password";

    } catch (error) {
        console.error("Decryption error:", error);

        alert(
            "Unable to unlock this password. Check your Master Password."
        );
    }
}


// ============================================
// PASSWORD VAULT - CREATE / UPDATE
// ============================================

const vaultForm = document.getElementById("vaultForm");

vaultForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const entryId = document.getElementById("entryId").value;
    const isEditing = entryId !== "";

    const siteName = document.getElementById("siteName").value.trim();
    const siteUrl = document.getElementById("siteUrl").value.trim();
    const accountUsername =
        document.getElementById("accountUsername").value.trim();

    const rawPassword =
        document.getElementById("accountPassword").value;

    if (!siteName || !siteUrl || !accountUsername) {
        alert("Please complete all required information.");
        return;
    }

    let encryptedPassword;
    let salt;
    let iv;

    try {
        if (rawPassword !== "") {
            // A new password is being saved or an existing password changed.
            const masterPassword = prompt(
                "Create or enter your Master Password to encrypt this password:"
            );

            if (masterPassword === null || masterPassword === "") {
                return;
            }

            const encryptedData = await encryptData(
                { password: rawPassword },
                masterPassword
            );

            encryptedPassword = encryptedData.ciphertext;
            salt = encryptedData.salt;
            iv = encryptedData.iv;

        } else if (isEditing) {
            // Blank password during editing means keep the old password.
            const oldEntry = currentVaultData.find(
                item => item.entryId === Number(entryId)
            );

            if (!oldEntry) {
                throw new Error("The existing vault entry could not be found.");
            }

            const oldEncryption = getEncryptionParts(oldEntry);

            encryptedPassword = oldEncryption.ciphertext;
            salt = oldEncryption.salt;
            iv = oldEncryption.iv;

        } else {
            alert("Please enter a password.");
            return;
        }

        const newEntry = {
            userId: CURRENT_USER_ID,
            siteName: siteName,
            siteUrl: siteUrl,
            accountUsername: accountUsername,
            encryptedPassword: encryptedPassword,
            salt: salt,
            iv: iv
        };

        const url = isEditing
            ? `${API_BASE_URL}/${entryId}`
            : API_BASE_URL;

        const method = isEditing ? "PUT" : "POST";

        await apiRequest(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newEntry)
        });

        alert(
            isEditing
                ? "Password entry updated successfully!"
                : "Password encrypted and saved successfully!"
        );

        resetForm();
        await loadVaultEntries();

    } catch (error) {
        console.error("Save error:", error);
        alert("Unable to save the password: " + error.message);
    }
});


// ============================================
// PASSWORD VAULT - EDIT
// ============================================

function editVaultItem(entryId) {
    const item = currentVaultData.find(
        entry => entry.entryId === entryId
    );

    if (!item) return;

    document.getElementById("formTitle").textContent =
        "Edit Saved Password";

    document.getElementById("submitBtn").textContent =
        "Update Password";

    document.getElementById("cancelBtn").style.display =
        "inline-block";

    document.getElementById("entryId").value = item.entryId;
    document.getElementById("siteName").value = item.siteName;
    document.getElementById("siteUrl").value = item.siteUrl;
    document.getElementById("accountUsername").value =
        item.accountUsername;

    // Leave password blank to keep the old encrypted password.
    document.getElementById("accountPassword").value = "";

    document.getElementById("accountPassword").placeholder =
        "Enter a new password, or leave blank to keep the current one.";

    document.getElementById("accountPassword").required = false;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================
// PASSWORD VAULT - RESET FORM
// ============================================

function resetForm() {
    document.getElementById("vaultForm").reset();

    document.getElementById("entryId").value = "";

    document.getElementById("formTitle").textContent =
        "Add a New Password";

    document.getElementById("submitBtn").textContent =
        "Save Password";

    document.getElementById("cancelBtn").style.display =
        "none";

    document.getElementById("accountPassword").placeholder = "";

    document.getElementById("accountPassword").required = true;
}


// ============================================
// PASSWORD VAULT - DELETE
// ============================================

async function deleteVaultItem(entryId) {
    const confirmed = confirm(
        "Are you sure you want to delete this saved password?"
    );

    if (!confirmed) return;

    try {
        await apiRequest(
            `${API_BASE_URL}/${entryId}?userId=${CURRENT_USER_ID}`,
            {
                method: "DELETE"
            }
        );

        alert("Password entry deleted.");
        await loadVaultEntries();

    } catch (error) {
        console.error("Delete error:", error);
        alert("Unable to delete this entry: " + error.message);
    }
}


// ============================================
// SCAM MESSAGE CHECKER
// ============================================

function checkMessage() {
    const messageInput = document.getElementById("messageInput");
    const result = document.getElementById("result");

    const message = messageInput.value.trim();

    result.replaceChildren();
    result.className = "result";

    if (message.length === 0) {
        result.textContent = "Please paste a message before checking.";
        result.classList.add("warning");
        return;
    }

    const lowerMessage = message.toLowerCase();

    const warningPatterns = [
        {
            label: "Urgent or threatening language",
            pattern: /\b(urgent|immediately|right now|act now|account blocked|account suspended|last warning|within 24 hours|final notice)\b/i
        },
        {
            label: "Requests for passwords or security codes",
            pattern: /\b(password|passcode|otp|one.time password|pin|verification code|security code)\b/i
        },
        {
            label: "Unexpected prizes or rewards",
            pattern: /\b(you have won|winner|won a prize|claim your prize|free gift|lottery|reward)\b/i
        },
        {
            label: "Requests for money or payments",
            pattern: /\b(send money|transfer money|pay now|processing fee|payment required|bank transfer|gift card)\b/i
        },
        {
            label: "Suspicious link-related wording",
            pattern: /\b(click here|open this link|verify your account|confirm your account|update your details|login here)\b/i
        },
        {
            label: "Requests for personal or financial information",
            pattern: /\b(bank details|credit card|debit card|national id|nid number|personal information|account details)\b/i
        }
    ];

    const findings = warningPatterns.filter(item =>
        item.pattern.test(lowerMessage)
    );

    // Create heading safely
    const heading = document.createElement("h2");

    if (findings.length > 0) {
        result.classList.add("warning");

        heading.textContent =
            "Warning: Possible signs of a suspicious message";

        const explanation = document.createElement("p");
        explanation.textContent =
            "We found the following warning signs:";

        const list = document.createElement("ul");

        findings.forEach(item => {
            const listItem = document.createElement("li");
            listItem.textContent = item.label;
            list.appendChild(listItem);
        });

        const advice = document.createElement("p");
        advice.textContent =
            "Do not click unexpected links, share OTPs or passwords, or send money until you independently verify the sender.";

        result.append(heading, explanation, list, advice);

    } else {
        result.classList.add("safe");

        heading.textContent = "No common warning signs detected.";

        const explanation = document.createElement("p");
        explanation.textContent =
            "This does not prove that the message is safe. Be careful with unexpected messages and verify the sender through an official channel.";

        result.append(heading, explanation);
    }
}


// ============================================
// INITIALIZE PROJECT
// ============================================

window.addEventListener("DOMContentLoaded", () => {
    autoLogin();
});
