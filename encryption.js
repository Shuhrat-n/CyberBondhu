
// CyberBondhu - AES-GCM Encryption

const ENCRYPTION_ALGORITHM = "AES-GCM";
const KEY_DERIVATION_ALGORITHM = "PBKDF2";

// Generate an encryption key from the master password
async function deriveKey(masterPassword, salt) {
    const encoder = new TextEncoder();

    // Convert master password into key material
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(masterPassword),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    // Derive AES-GCM key
    return crypto.subtle.deriveKey(
        {
            name: KEY_DERIVATION_ALGORITHM,
            salt: salt,
            iterations: 600000,
            hash: "SHA-256"
        },
        passwordKey,
        {
            name: ENCRYPTION_ALGORITHM,
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );
}

// Encrypt password information
async function encryptData(data, masterPassword) {
    const encoder = new TextEncoder();

    // Generate random salt and IV (nonce)
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Generate encryption key
    const key = await deriveKey(masterPassword, salt);

    // Convert data into bytes
    const plaintext = encoder.encode(JSON.stringify(data));

    // Encrypt using AES-GCM
    const ciphertext = await crypto.subtle.encrypt(
        {
            name: ENCRYPTION_ALGORITHM,
            iv: iv
        },
        key,
        plaintext
    );

    // Convert binary data into Base64 for storage
    const toBase64 = (bytes) =>
        btoa(String.fromCharCode(...new Uint8Array(bytes)));

    return {
        salt: toBase64(salt),
        iv: toBase64(iv),
        ciphertext: toBase64(ciphertext)
    };
}

// Decrypt password information
async function decryptData(encryptedData, masterPassword) {
    const decoder = new TextDecoder();

    // Convert Base64 back into bytes
    const fromBase64 = (value) =>
        Uint8Array.from(atob(value), c => c.charCodeAt(0));

    const salt = fromBase64(encryptedData.salt);
    const iv = fromBase64(encryptedData.iv);
    const ciphertext = fromBase64(encryptedData.ciphertext);

    // Derive the same encryption key
    const key = await deriveKey(masterPassword, salt);

    // Decrypt the information
    const decrypted = await crypto.subtle.decrypt(
        {
            name: ENCRYPTION_ALGORITHM,
            iv: iv
        },
        key,
        ciphertext
    );

    return JSON.parse(decoder.decode(decrypted));
}
