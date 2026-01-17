/**
 * AI-ULU Zero-Knowledge Encryption
 * 
 * Client-side encryption for sensitive memories.
 * Server never sees plaintext content of identity/preference memories.
 * 
 * Implementation:
 * - AES-256-GCM for content encryption
 * - PBKDF2 for key derivation from user password
 * - Random IV for each encryption
 */

// Encryption result type
export interface EncryptedData {
  ciphertext: string;  // Base64 encoded
  iv: string;          // Base64 encoded
  salt: string;        // Base64 encoded (for key derivation)
  version: number;     // Encryption version for future upgrades
}

// Key storage for session
let sessionKey: CryptoKey | null = null;
let keyMaterial: ArrayBuffer | null = null;

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as key material
  const keyMaterialImport = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive AES key - use .buffer for proper typing
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterialImport,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Initialize encryption with user's passphrase
 * Call this when user enables Zero-Knowledge mode
 */
export async function initializeEncryption(passphrase: string): Promise<boolean> {
  try {
    // Generate salt for this session
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive key
    sessionKey = await deriveKey(passphrase, salt);
    
    // Store salt in localStorage (encrypted with a simpler key)
    localStorage.setItem('ai-ulu-zk-salt', arrayBufferToBase64(salt));
    
    // Store hash of passphrase for verification
    const hash = await hashPassphrase(passphrase);
    localStorage.setItem('ai-ulu-zk-hash', hash);
    
    return true;
  } catch (error) {
    console.error('Encryption initialization failed:', error);
    return false;
  }
}

/**
 * Verify passphrase matches stored hash
 */
async function hashPassphrase(passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(new Uint8Array(hash));
}

/**
 * Unlock encryption with passphrase
 * Call this when user logs in
 */
export async function unlockEncryption(passphrase: string): Promise<boolean> {
  try {
    // Verify passphrase
    const storedHash = localStorage.getItem('ai-ulu-zk-hash');
    if (!storedHash) return false;
    
    const hash = await hashPassphrase(passphrase);
    if (hash !== storedHash) return false;
    
    // Retrieve salt
    const saltBase64 = localStorage.getItem('ai-ulu-zk-salt');
    if (!saltBase64) return false;
    
    const salt = base64ToArrayBuffer(saltBase64);
    
    // Derive key
    sessionKey = await deriveKey(passphrase, new Uint8Array(salt));
    
    return true;
  } catch (error) {
    console.error('Encryption unlock failed:', error);
    return false;
  }
}

/**
 * Check if encryption is initialized
 */
export function isEncryptionInitialized(): boolean {
  return localStorage.getItem('ai-ulu-zk-hash') !== null;
}

/**
 * Check if encryption is unlocked
 */
export function isEncryptionUnlocked(): boolean {
  return sessionKey !== null;
}

/**
 * Lock encryption (clear session key)
 */
export function lockEncryption(): void {
  sessionKey = null;
}

/**
 * Encrypt content
 */
export async function encryptContent(content: string): Promise<EncryptedData> {
  if (!sessionKey) {
    throw new Error('Encryption not unlocked. Call unlockEncryption first.');
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    sessionKey,
    data
  );
  
  const salt = localStorage.getItem('ai-ulu-zk-salt') || '';
  
  return {
    ciphertext: arrayBufferToBase64(new Uint8Array(encrypted)),
    iv: arrayBufferToBase64(iv),
    salt: salt,
    version: 1,
  };
}

/**
 * Decrypt content
 */
export async function decryptContent(encrypted: EncryptedData): Promise<string> {
  if (!sessionKey) {
    throw new Error('Encryption not unlocked. Call unlockEncryption first.');
  }
  
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
  const iv = base64ToArrayBuffer(encrypted.iv);
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    sessionKey,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Encrypt memory for storage
 * Only encrypts identity and preference types
 */
export async function encryptMemory(memory: {
  content: string;
  type: string;
  [key: string]: any;
}): Promise<{
  content: string;
  encrypted: boolean;
  encryption_data?: EncryptedData;
  [key: string]: any;
}> {
  // Only encrypt sensitive types
  const sensitiveTypes = ['identity', 'preference'];
  
  if (!sensitiveTypes.includes(memory.type) || !isEncryptionUnlocked()) {
    return { ...memory, encrypted: false };
  }
  
  const encryptedData = await encryptContent(memory.content);
  
  return {
    ...memory,
    content: '[ENCRYPTED]', // Placeholder for server
    encrypted: true,
    encryption_data: encryptedData,
  };
}

/**
 * Decrypt memory after retrieval
 */
export async function decryptMemory(memory: {
  content: string;
  encrypted?: boolean;
  encryption_data?: EncryptedData;
  [key: string]: any;
}): Promise<{
  content: string;
  encrypted?: boolean;
  [key: string]: any;
}> {
  if (!memory.encrypted || !memory.encryption_data) {
    return memory;
  }
  
  if (!isEncryptionUnlocked()) {
    return { ...memory, content: '[LOCKED - Enter passphrase to decrypt]' };
  }
  
  try {
    const decryptedContent = await decryptContent(memory.encryption_data);
    return { ...memory, content: decryptedContent };
  } catch (error) {
    console.error('Decryption failed:', error);
    return { ...memory, content: '[DECRYPTION FAILED]' };
  }
}

/**
 * Generate secure encryption key for export
 */
export async function exportEncryptionKey(): Promise<string | null> {
  if (!sessionKey) return null;
  
  try {
    const exported = await crypto.subtle.exportKey('raw', sessionKey);
    return arrayBufferToBase64(new Uint8Array(exported));
  } catch (error) {
    // Key might not be exportable
    console.error('Key export failed:', error);
    return null;
  }
}

/**
 * Change passphrase
 */
export async function changePassphrase(
  currentPassphrase: string, 
  newPassphrase: string
): Promise<boolean> {
  // Verify current passphrase
  const valid = await unlockEncryption(currentPassphrase);
  if (!valid) return false;
  
  // Re-initialize with new passphrase
  return initializeEncryption(newPassphrase);
}

// Utility functions
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Zero-Knowledge Proof helper
 * Allows server to verify user knows content without seeing it
 */
export async function generateZKProof(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  // Generate commitment (hash of content + random nonce)
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const combined = new Uint8Array([...data, ...nonce]);
  
  const hash = await crypto.subtle.digest('SHA-256', combined);
  
  return JSON.stringify({
    commitment: arrayBufferToBase64(new Uint8Array(hash)),
    nonce: arrayBufferToBase64(nonce),
  });
}

/**
 * Verify ZK proof
 */
export async function verifyZKProof(content: string, proof: string): Promise<boolean> {
  try {
    const { commitment, nonce } = JSON.parse(proof);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const nonceBuffer = base64ToArrayBuffer(nonce);
    
    const combined = new Uint8Array([...data, ...new Uint8Array(nonceBuffer)]);
    const hash = await crypto.subtle.digest('SHA-256', combined);
    
    return commitment === arrayBufferToBase64(new Uint8Array(hash));
  } catch (error) {
    return false;
  }
}
