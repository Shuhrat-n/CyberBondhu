
// CyberBondhu - AES-GCM Encryption using Web Crypto API

const ENCRYPTION_ALGORITHM = "AES-GCM";
const KEY_DERIVATION_ALGORITHM = "PBKDF2";

const PBKDF2_ITERATIONS = 600000;
const AES_KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

// Convert bytes into Base64
function toBase64(bytes) {
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

// Convert Base64 into bytes
function fromBase64(value) {
    const binary = atob(value);

    return Uint8Array.from(binary, character =>
        character.charCodeAt(0)
    );
}

// Generate an encryption key from the master password and salt
async function deriveKey(masterPassword, salt) {

    if (!masterPassword || typeof masterPassword !== "string") {
        throw new Error("A valid master password is required.");
    }

    if (!(salt instanceof Uint8Array) || salt.length !== SALT_LENGTH) {
        throw new Error("Invalid encryption salt.");
    }

    const encoder = new TextEncoder();

    // Convert master password into key material
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(masterPassword),
        { name: KEY_DERIVATION_ALGORITHM },
        false,
        ["deriveKey"]
    );

    // Derive a 256-bit AES-GCM key
    return crypto.subtle.deriveKey(
        {
            name: KEY_DERIVATION_ALGORITHM,
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256"
        },
        passwordKey,
        {
            name: ENCRYPTION_ALGORITHM,
            length: AES_KEY_LENGTH
        },
        false,
        ["encrypt", "decrypt"]
    );
}

// Encrypt password information
async function encryptData(data, masterPassword) {

    if (!crypto.subtle) {
        throw new Error(
            "Web Crypto is unavailable. Use HTTPS or localhost."
        );
    }

    if (!data || typeof data !== "object") {
        throw new Error("Valid password information is required.");
    }

    // Generate a new random salt and IV for every encryption
    const salt = crypto.getRandomValues(
        new Uint8Array(SALT_LENGTH)
    );

    const iv = crypto.getRandomValues(
        new Uint8Array(IV_LENGTH)
    );

    // Derive encryption key
    const key = await deriveKey(masterPassword, salt);

    const encoder = new TextEncoder();

    // Convert password information into bytes
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

    // Return values separately for backend storage
    return {
        salt: toBase64(salt),
        iv: toBase64(iv),
        ciphertext: toBase64(new Uint8Array(ciphertext))
    };
}

// Decrypt password information
async function decryptData(encryptedData, masterPassword) {

    if (!crypto.subtle) {
        throw new Error(
            "Web Crypto is unavailable. Use HTTPS or localhost."
        );
    }

    if (
        !encryptedData ||
        !encryptedData.salt ||
        !encryptedData.iv ||
        !encryptedData.ciphertext
    ) {
        throw new Error("Encrypted data is incomplete.");
    }

    // Convert stored Base64 values back into bytes
    const salt = fromBase64(encryptedData.salt);
    const iv = fromBase64(encryptedData.iv);
    const ciphertext = fromBase64(encryptedData.ciphertext);

    if (salt.length !== SALT_LENGTH) {
        throw new Error("Invalid salt length.");
    }

    if (iv.length !== IV_LENGTH) {
        throw new Error("Invalid IV length.");
    }

    // Derive the same key using the original salt
    const key = await deriveKey(masterPassword, salt);

    // AES-GCM verifies the authentication tag during decryption
    const decrypted = await crypto.subtle.decrypt(
        {
            name: ENCRYPTION_ALGORITHM,
            iv: iv
        },
        key,
        ciphertext
    );

    const decoder = new TextDecoder();

    return JSON.parse(decoder.decode(decrypted));
}
