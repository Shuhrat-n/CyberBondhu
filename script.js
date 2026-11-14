// --- Page Navigation ---
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) selectedPage.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- Vault Logic ---
const CURRENT_USER_ID = 1; 
const API_BASE_URL = "http://localhost:8080/api/vault";
const AUTH_URL = "http://localhost:8080/api/auth";
const MASTER_PASSWORD = "MyStrongMasterPassword123!"; // The key to encrypt/decrypt

let jwtToken = null;
let currentVaultData = []; 

// 1. Auto Login
function autoLogin() {
    fetch(`${AUTH_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nakiba.demo@example.com", password: "Nakiba@Demo1" })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            jwtToken = data.token;
            loadVaultEntries(); 
        }
    })
    .catch(error => console.error("Login error:", error));
}

// 2. READ (View List)
function loadVaultEntries() {
    const vaultList = document.getElementById("vaultList");
    vaultList.innerHTML = "<p>Loading your vault...</p>";

    fetch(`${API_BASE_URL}/user/${CURRENT_USER_ID}`, {
        headers: { "Authorization": `Bearer ${jwtToken}` }
    })
    .then(res => res.json())
    .then(data => {
        currentVaultData = data; 
        vaultList.innerHTML = ""; 
        
        if (data.length === 0) {
            vaultList.innerHTML = "<p>No passwords saved yet.</p>";
            return;
        }

        data.forEach(item => {
            const div = document.createElement("div");
            div.className = "vault-item";
            div.innerHTML = `
                <div class="vault-info">
                    <h3>${item.siteName}</h3>
                    <p><strong>User:</strong> ${item.accountUsername}</p>
                    <p><strong>Password:</strong> <span id="pass-${item.entryId}" class="password-hidden">••••••••</span></p>
                </div>
                <div class="vault-actions">
                    <button class="view-btn" onclick="toggleView(${item.entryId})">Show</button>
                    <button class="edit-btn" onclick="editVaultItem(${item.entryId})">Edit</button>
                    <button class="delete-btn" onclick="deleteVaultItem(${item.entryId})">Delete</button>
                </div>
            `;
            vaultList.appendChild(div);
        });
    })
    .catch(error => console.error(error));
}

// 3. VIEW (Decrypt Password using encryption.js, Prompt for Master Password, then Decrypt)
async function toggleView(entryId) {
    const passSpan = document.getElementById(`pass-${entryId}`);
    const btn = event.target;
    
    // If it is currently hidden, we need to decrypt it
    if (passSpan.classList.contains("password-hidden")) {
        const item = currentVaultData.find(i => i.entryId === entryId);
        if (!item) return;

        // --- ASK FOR MASTER PASSWORD ---
        const userMasterPassword = prompt("Please enter your Master Password to unlock this:");
        
        if (!userMasterPassword) return; // User clicked Cancel

        try {
            
            // Split the salt and ciphertext
            const [saltBase64, ciphertextBase64] = item.encryptedPassword.split(":");
            
            if (!saltBase64 || !ciphertextBase64) {
                passSpan.textContent = item.encryptedPassword;
            } else {
                const encryptedObj = {
                    salt: saltBase64,
                    iv: item.iv,
                    ciphertext: ciphertextBase64
                };
                
                // Use decryptData with the password the USER just typed
                const decryptedObj = await decryptData(encryptedObj, userMasterPassword);
                
                // Show the decrypted password
                passSpan.textContent = decryptedObj.password;
            }
            
            passSpan.classList.remove("password-hidden");
            btn.textContent = "Hide";
            
        } catch (error) {
            console.error("Decryption failed:", error);
            alert("Incorrect Master Password! Please try again.");
        }
    } else {
        // Hide it again
        passSpan.textContent = "••••••••";
        passSpan.classList.add("password-hidden");
        btn.textContent = "Show";
    }
}

// 4. CREATE & UPDATE (Encrypt Password)
document.getElementById("vaultForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const entryId = document.getElementById("entryId").value;
    const isEditing = entryId !== "";
    const rawPassword = document.getElementById("accountPassword").value;

    let encryptedPayload;
    
    try {
        // Use encryptData function
        // We pack the real password into a JSON object
        const dataToEncrypt = { password: rawPassword };
        encryptedPayload = await encryptData(dataToEncrypt, MASTER_PASSWORD);
        
        // Validate that encryption worked
        if (!encryptedPayload.ciphertext) throw new Error("Encryption failed");
        
    } catch (error) {
        alert("Failed to encrypt password: " + error.message);
        return;
    }

    // Combine salt and ciphertext into one string for the DB
    const combinedEncryptedPassword = `${encryptedPayload.salt}:${encryptedPayload.ciphertext}`;

    const newEntry = {
        userId: CURRENT_USER_ID,
        siteName: document.getElementById("siteName").value,
        siteUrl: document.getElementById("siteUrl").value,
        accountUsername: document.getElementById("accountUsername").value,
        encryptedPassword: combinedEncryptedPassword, // Storing salt:ciphertext
        iv: encryptedPayload.iv
    };

    const url = isEditing ? `${API_BASE_URL}/${entryId}` : API_BASE_URL;
    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
        method: method,
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwtToken}` 
        },
        body: JSON.stringify(newEntry)
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to save");
        return res.json();
    })
    .then(data => {
        alert(isEditing ? "Password updated and re-encrypted!" : "Password encrypted and saved!");
        resetForm();
        loadVaultEntries(); 
    })
    .catch(error => alert("Error saving password."));
});

// 5. EDIT (We don't decrypt immediately, just load the site info)
function editVaultItem(entryId) {
    const item = currentVaultData.find(i => i.entryId === entryId);
    if (!item) return;

    document.getElementById("formTitle").textContent = "Edit Password";
    document.getElementById("submitBtn").textContent = "Update Password";
    document.getElementById("cancelBtn").style.display = "inline-block";

    document.getElementById("entryId").value = item.entryId;
    document.getElementById("siteName").value = item.siteName;
    document.getElementById("siteUrl").value = item.siteUrl;
    document.getElementById("accountUsername").value = item.accountUsername;
    
    // We leave the password field BLANK for security. 
    // The user must type a new password if they want to change it.
    document.getElementById("accountPassword").value = "";
    document.getElementById("accountPassword").placeholder = "Enter a new password (or leave blank to keep current)";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// 6. Reset Form
function resetForm() {
    document.getElementById("vaultForm").reset();
    document.getElementById("entryId").value = "";
    document.getElementById("formTitle").textContent = "Add a New Password";
    document.getElementById("submitBtn").textContent = "Save Password";
    document.getElementById("cancelBtn").style.display = "none";
    document.getElementById("accountPassword").placeholder = "";
}

// 7. DELETE
function deleteVaultItem(entryId) {
    if (!confirm("Are you sure you want to delete this password?")) return;

    fetch(`${API_BASE_URL}/${entryId}?userId=${CURRENT_USER_ID}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${jwtToken}` }
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to delete");
        loadVaultEntries(); 
    })
    .catch(error => alert("Error deleting password."));
}

// 8. Initialize
window.addEventListener("DOMContentLoaded", autoLogin);

// TEST ENCRYPTION 
async function testEncryption() {
    const masterPassword = "MyStrongMasterPassword123!";
    const passwordInfo = { website: "Example.com", username: "elderly_user", password: "MyExamplePassword123" };
    const encrypted = await encryptData(passwordInfo, masterPassword);
    console.log("Encrypted data:", encrypted);
    const decrypted = await decryptData(encrypted, masterPassword);
    console.log("Decrypted data:", decrypted);
}
