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

    // Load a fresh round whenever the user opens the game page.
    if (pageId === "game") {
        loadGameScenarios();
    }
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
const GAME_API_URL = "http://localhost:8080/api/game";

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
        await loadGameProgress();

        // If the user opened the game while login was still completing,
        // load the scenarios now that the JWT is available.
        const gamePage = document.getElementById("game");
        if (gamePage && !gamePage.classList.contains("hidden")) {
            await loadGameScenarios();
        }

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
// CYBERBONDHU SAFETY GAME - FRONTEND INTEGRATION
// ============================================

let gameScenarios = [];
let currentGameIndex = 0;
let gameAnswerSubmitted = false;


// ---------- LOAD SCENARIOS ----------

async function loadGameScenarios() {
    const title = document.getElementById("gameScenarioTitle");
    const message = document.getElementById("gameMessage");
    const choicesContainer = document.getElementById("gameChoices");
    const feedback = document.getElementById("gameFeedback");
    const nextButton = document.getElementById("gameNextBtn");
    const count = document.getElementById("gameScenarioCount");

    // The game markup must exist in index.html.
    if (!title || !message || !choicesContainer || !feedback || !nextButton || !count) {
        console.warn("Game UI elements are missing from index.html.");
        return;
    }

    title.textContent = "Loading game...";
    message.textContent = "";
    choicesContainer.replaceChildren();
    feedback.replaceChildren();
    feedback.className = "game-feedback hidden";
    nextButton.classList.add("hidden");

    try {
        const scenarios = await apiRequest(
            `${GAME_API_URL}/start?lang=en&limit=5`
        );

        if (!Array.isArray(scenarios) || scenarios.length === 0) {
            throw new Error("No game scenarios are available.");
        }

        gameScenarios = scenarios;
        currentGameIndex = 0;
        displayGameScenario();

    } catch (error) {
        console.error("Game loading error:", error);
        title.textContent = "Unable to load the game";
        message.textContent = error.message ||
            "Please make sure the backend is running and you are logged in.";
        count.textContent = "Game unavailable";
    }
}


// ---------- DISPLAY CURRENT SCENARIO ----------

function displayGameScenario() {
    const scenario = gameScenarios[currentGameIndex];

    const title = document.getElementById("gameScenarioTitle");
    const message = document.getElementById("gameMessage");
    const choicesContainer = document.getElementById("gameChoices");
    const feedback = document.getElementById("gameFeedback");
    const nextButton = document.getElementById("gameNextBtn");
    const count = document.getElementById("gameScenarioCount");

    if (!title || !message || !choicesContainer || !feedback || !nextButton || !count) {
        return;
    }

    if (!scenario) {
        title.textContent = "Round Completed!";
        message.textContent = "You have finished all the scenarios in this round.";
        choicesContainer.replaceChildren();
        count.textContent = "Round completed";

        feedback.replaceChildren();
        feedback.className = "game-feedback safe";

        const heading = document.createElement("h2");
        heading.textContent = "🎉 Well done!";

        const explanation = document.createElement("p");
        explanation.textContent =
            "Keep practicing to improve your online safety skills.";

        feedback.append(heading, explanation);

        nextButton.textContent = "Play Again";
        nextButton.classList.remove("hidden");
        return;
    }

    gameAnswerSubmitted = false;

    count.textContent =
        `Scenario ${currentGameIndex + 1} of ${gameScenarios.length}`;

    title.textContent = scenario.title;
    message.textContent = scenario.message;

    choicesContainer.replaceChildren();
    feedback.replaceChildren();
    feedback.className = "game-feedback hidden";
    nextButton.classList.add("hidden");

    scenario.choices.forEach(choice => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "game-choice";
        button.textContent = choice.text;
        button.setAttribute("aria-label", `Choose: ${choice.text}`);

        button.addEventListener("click", () => {
            submitGameAnswer(scenario.id, choice.id);
        });

        choicesContainer.appendChild(button);
    });
}


// ---------- SUBMIT ANSWER ----------

async function submitGameAnswer(scenarioId, choiceId) {
    if (gameAnswerSubmitted) return;

    gameAnswerSubmitted = true;

    const choicesContainer = document.getElementById("gameChoices");
    const feedback = document.getElementById("gameFeedback");
    const nextButton = document.getElementById("gameNextBtn");

    if (!choicesContainer || !feedback || !nextButton) return;

    // Prevent the user from submitting more than one choice.
    choicesContainer.querySelectorAll("button").forEach(button => {
        button.disabled = true;
    });

    feedback.className = "game-feedback";
    feedback.textContent = "Checking your answer...";

    try {
        const result = await apiRequest(
            `${GAME_API_URL}/submit?lang=en`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    scenarioId: scenarioId,
                    choiceId: choiceId
                })
            }
        );

        feedback.replaceChildren();

        const heading = document.createElement("h2");
        const explanation = document.createElement("p");

        if (result.safe === true) {
            feedback.classList.add("safe");
            heading.textContent = "✅ Safe Choice!";
        } else {
            feedback.classList.add("danger");
            heading.textContent = "⚠️ Be Careful!";
        }

        explanation.textContent = result.feedback || "Thank you for answering.";
        feedback.append(heading, explanation);

        // If the selected option was unsafe, show the safe option.
        if (result.safe === false) {
            const correctAnswer = document.createElement("p");
            const label = document.createElement("strong");

            label.textContent = "The safest action: ";
            correctAnswer.append(
                label,
                document.createTextNode(result.correctChoiceText || "")
            );

            feedback.appendChild(correctAnswer);
        }

        nextButton.textContent = "Next Scenario";
        nextButton.classList.remove("hidden");

        await loadGameProgress();

    } catch (error) {
        console.error("Answer submission error:", error);

        gameAnswerSubmitted = false;
        feedback.className = "game-feedback danger";
        feedback.textContent =
            error.message || "Unable to submit your answer. Please try again.";

        choicesContainer.querySelectorAll("button").forEach(button => {
            button.disabled = false;
        });
    }
}


// ---------- NEXT SCENARIO ----------
function nextGameScenario() {
    // If we are at the last scenario, show the final result
    if (currentGameIndex >= gameScenarios.length - 1) {
        const title = document.getElementById("gameScenarioTitle");
        const message = document.getElementById("gameMessage");
        const choicesContainer = document.getElementById("gameChoices");
        const feedback = document.getElementById("gameFeedback");
        const nextButton = document.getElementById("gameNextBtn");
        const count = document.getElementById("gameScenarioCount");

        count.textContent = "Round Completed!";
        title.textContent = "🎉 Great Job!";
        message.textContent = "You have finished all the scenarios in this round. Check your updated Safety Progress on the Home page!";
        choicesContainer.replaceChildren();
        
        feedback.className = "game-feedback safe";
        feedback.innerHTML = "<h2>✅ Round Complete</h2><p>Your answers have been saved. Go back to the Home page to see your updated progress.</p>";
        
        nextButton.textContent = "Return to Home";
        nextButton.classList.remove("hidden");
        
        // Change the button to go home instead of restarting the game
        nextButton.onclick = () => {
            showPage("home");
            loadGameProgress(); // Refresh the home page progress
            nextButton.onclick = nextGameScenario; // Reset for next time
        };
        
        return;
    }

    currentGameIndex++;
    displayGameScenario();
}


// ---------- DASHBOARD PROGRESS ----------

async function loadGameProgress() {
    const circle = document.getElementById("gameProgressCircle");
    const percentText = document.getElementById("gameProgressPercent");
    const progressText = document.getElementById("gameProgressText");

    // The dashboard widget may not have been added yet.
    if (!circle || !percentText || !progressText) return;

    try {
        const progress = await apiRequest(`${GAME_API_URL}/progress`);

        const percent = Math.max(
            0,
            Math.min(100, Number(progress.safetyPercent) || 0)
        );

        circle.style.setProperty("--progress", `${percent}%`);
        circle.setAttribute("aria-valuenow", String(percent));
        percentText.textContent = `${percent}%`;

        progressText.textContent =
            `${progress.completedScenarios} of ${progress.totalScenarios} scenarios completed`;

    } catch (error) {
        console.error("Game progress error:", error);
        progressText.textContent = "Your game progress could not be loaded.";
    }
}


// ============================================
// SCAM MESSAGE CHECKER
// ============================================

async function checkMessage() {
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

    result.textContent = "Analyzing message securely...";

    try {
        // Call backend using the existing API helper
        const response = await apiRequest("http://localhost:8080/api/scam/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: message, lang: "en" })
        });

        const heading = document.createElement("h2");

        if (response.riskLevel === "HIGH") {
            result.classList.add("warning");
            heading.textContent = "⚠️ Warning: High Risk Detected";
        } else if (response.riskLevel === "MEDIUM") {
            result.classList.add("warning");
            heading.textContent = "⚡ Caution: Possible Scam";
        } else {
            result.classList.add("safe");
            heading.textContent = "✅ No Common Warning Signs Detected";
        }

        const explanationList = document.createElement("ul");
        response.explanations.forEach(exp => {
            const li = document.createElement("li");
            li.textContent = exp;
            explanationList.appendChild(li);
        });

        result.append(heading, explanationList);

    } catch (error) {
        console.error("Backend error:", error);
        result.classList.add("warning");
        result.textContent = "Error connecting to the secure server. Please ensure you are logged in.";
    }
}


// ============================================
// INITIALIZE PROJECT
// ============================================

window.addEventListener("DOMContentLoaded", () => {
    const nextButton = document.getElementById("gameNextBtn");

    if (nextButton) {
        nextButton.addEventListener("click", nextGameScenario);
    }

    autoLogin();
});