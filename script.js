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

let jwtToken = null;
let currentVaultData = []; // Store data locally for View/Edit

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
        currentVaultData = data; // Save for later
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
                    <p><strong>Password:</strong> <span id="pass-${item.entryId}" style="display:none;">${item.encryptedPassword}</span></p>
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

// 3. VIEW (Show/Hide Password)
function toggleView(entryId) {
    const passSpan = document.getElementById(`pass-${entryId}`);
    const btn = event.target; // Get the button that was clicked
    
    if (passSpan.style.display === "none") {
        passSpan.style.display = "inline";
        btn.textContent = "Hide";
    } else {
        passSpan.style.display = "none";
        btn.textContent = "Show";
    }
}

// 4. CREATE & UPDATE (Form Submit)
document.getElementById("vaultForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const entryId = document.getElementById("entryId").value;
    const isEditing = entryId !== "";

    const newEntry = {
        userId: CURRENT_USER_ID,
        siteName: document.getElementById("siteName").value,
        siteUrl: document.getElementById("siteUrl").value,
        accountUsername: document.getElementById("accountUsername").value,
        encryptedPassword: "mock_encrypted_" + document.getElementById("accountPassword").value, 
        iv: "mock_iv_123"
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
        alert(isEditing ? "Password updated!" : "Password saved!");
        resetForm();
        loadVaultEntries(); 
    })
    .catch(error => alert("Error saving password."));
});

// 5. EDIT (Populate form)
function editVaultItem(entryId) {
    // Find the item in our local data
    const item = currentVaultData.find(i => i.entryId === entryId);
    if (!item) return;

    // Change form UI
    document.getElementById("formTitle").textContent = "Edit Password";
    document.getElementById("submitBtn").textContent = "Update Password";
    document.getElementById("cancelBtn").style.display = "inline-block";

    // Fill form with data
    document.getElementById("entryId").value = item.entryId;
    document.getElementById("siteName").value = item.siteName;
    document.getElementById("siteUrl").value = item.siteUrl;
    document.getElementById("accountUsername").value = item.accountUsername;
    
    // Un-hide the password (removing "mock_encrypted_" prefix for display)
    const realPass = item.encryptedPassword.replace("mock_encrypted_", "");
    document.getElementById("accountPassword").value = realPass;

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// 6. Reset Form
function resetForm() {
    document.getElementById("vaultForm").reset();
    document.getElementById("entryId").value = "";
    document.getElementById("formTitle").textContent = "Add a New Password";
    document.getElementById("submitBtn").textContent = "Save Password";
    document.getElementById("cancelBtn").style.display = "none";
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

// encryption

async function testEncryption() {

    // master password
    const masterPassword = "MyStrongMasterPassword123!";

    const passwordInfo = {
        website: "Example.com",
        username: "elderly_user",
        password: "MyExamplePassword123"
    };

    // Encrypt the information
    const encrypted = await encryptData(
        passwordInfo,
        masterPassword
    );

    console.log("Encrypted data:", encrypted);

    // Decrypt the information
    const decrypted = await decryptData(
        encrypted,
        masterPassword
        // wrongpassword
    );

    console.log("Decrypted data:", decrypted);
}

testEncryption();

