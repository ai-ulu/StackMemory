/**
 * End-to-End Encryption (E2EE) Manager
 * 
 * Zero-knowledge architecture:
 * - RSA-2048 for key encryption
 * - AES-256-GCM for data encryption
 * - Client-side encryption only
 * - Server never sees unencrypted data
 */

export interface EncryptedData {
  data: string        // Base64 encrypted content
  key: string         // Base64 encrypted AES key
  iv: string          // Base64 initialization vector
  algorithm: string   // Encryption algorithm used
}

export interface KeyPair {
  publicKey: string
  privateKey: string
  createdAt: number
}

export class EncryptionManager {
  private static instance: EncryptionManager
  private keyPair: KeyPair | null = null
  private isInitialized = false

  private constructor() {}

  static getInstance(): EncryptionManager {
    if (!EncryptionManager.instance) {
      EncryptionManager.instance = new EncryptionManager()
    }
    return EncryptionManager.instance
  }

  /**
   * Initialize encryption manager
   * Loads existing keys or generates new ones
   */
  async initialize(password?: string): Promise<void> {
    if (this.isInitialized) return

    try {
      // Try to load existing keys from localStorage
      const storedKeys = localStorage.getItem('aiulu_encryption_keys')
      
      if (storedKeys) {
        const encrypted = JSON.parse(storedKeys)
        
        if (password) {
          // Decrypt private key with password
          this.keyPair = await this.decryptKeyPair(encrypted, password)
        } else {
          // Use unencrypted keys (for demo/testing)
          this.keyPair = encrypted
        }
      } else {
        // Generate new key pair
        this.keyPair = await this.generateKeyPair()
        
        // Store keys (encrypted with password if provided)
        if (password) {
          const encrypted = await this.encryptKeyPair(this.keyPair, password)
          localStorage.setItem('aiulu_encryption_keys', JSON.stringify(encrypted))
        } else {
          localStorage.setItem('aiulu_encryption_keys', JSON.stringify(this.keyPair))
        }
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize encryption:', error)
      throw new Error('Encryption initialization failed')
    }
  }

  /**
   * Generate RSA-2048 key pair
   */
  private async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )

    const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    return {
      publicKey: this.arrayBufferToBase64(publicKey),
      privateKey: this.arrayBufferToBase64(privateKey),
      createdAt: Date.now()
    }
  }

  /**
   * Encrypt memory content
   */
  async encryptMemory(content: string): Promise<EncryptedData> {
    if (!this.isInitialized || !this.keyPair) {
      throw new Error('Encryption manager not initialized')
    }

    try {
      // Generate random AES-256 key
      const aesKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      )

      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12))

      // Encrypt content with AES-256-GCM
      const encodedContent = new TextEncoder().encode(content)
      const encryptedContent = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encodedContent
      )

      // Export AES key
      const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey)

      // Encrypt AES key with RSA public key
      const publicKey = await this.importPublicKey(this.keyPair.publicKey)
      const encryptedAesKey = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        exportedAesKey
      )

      return {
        data: this.arrayBufferToBase64(encryptedContent),
        key: this.arrayBufferToBase64(encryptedAesKey),
        iv: this.arrayBufferToBase64(iv.buffer),
        algorithm: 'RSA-2048+AES-256-GCM'
      }
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt memory')
    }
  }

  /**
   * Decrypt memory content
   */
  async decryptMemory(encrypted: EncryptedData): Promise<string> {
    if (!this.isInitialized || !this.keyPair) {
      throw new Error('Encryption manager not initialized')
    }

    try {
      // Import private key
      const privateKey = await this.importPrivateKey(this.keyPair.privateKey)

      // Decrypt AES key with RSA private key
      const encryptedAesKey = this.base64ToArrayBuffer(encrypted.key)
      const decryptedAesKey = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedAesKey
      )

      // Import AES key
      const aesKey = await window.crypto.subtle.importKey(
        'raw',
        decryptedAesKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      )

      // Decrypt content with AES key
      const encryptedContent = this.base64ToArrayBuffer(encrypted.data)
      const iv = this.base64ToArrayBuffer(encrypted.iv)
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encryptedContent
      )

      return new TextDecoder().decode(decryptedContent)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt memory')
    }
  }

  /**
   * Encrypt key pair with password (PBKDF2)
   */
  private async encryptKeyPair(keyPair: KeyPair, password: string): Promise<any> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const passwordKey = await this.deriveKeyFromPassword(password, salt.buffer)

    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const privateKeyBuffer = this.base64ToArrayBuffer(keyPair.privateKey)
    
    const encryptedPrivateKey = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      passwordKey,
      privateKeyBuffer
    )

    return {
      publicKey: keyPair.publicKey,
      encryptedPrivateKey: this.arrayBufferToBase64(encryptedPrivateKey),
      salt: this.arrayBufferToBase64(salt.buffer),
      iv: this.arrayBufferToBase64(iv.buffer),
      createdAt: keyPair.createdAt
    }
  }

  /**
   * Decrypt key pair with password
   */
  private async decryptKeyPair(encrypted: any, password: string): Promise<KeyPair> {
    const salt: ArrayBuffer = this.base64ToArrayBuffer(encrypted.salt)
    const passwordKey = await this.deriveKeyFromPassword(password, salt)

    const iv: ArrayBuffer = this.base64ToArrayBuffer(encrypted.iv)
    const encryptedPrivateKey: ArrayBuffer = this.base64ToArrayBuffer(encrypted.encryptedPrivateKey)

    const decryptedPrivateKey = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      passwordKey,
      encryptedPrivateKey
    )

    return {
      publicKey: encrypted.publicKey,
      privateKey: this.arrayBufferToBase64(decryptedPrivateKey),
      createdAt: encrypted.createdAt
    }
  }

  /**
   * Derive key from password using PBKDF2
   */
  private async deriveKeyFromPassword(
    password: string,
    salt: ArrayBuffer
  ): Promise<CryptoKey> {
    const passwordBuffer = new TextEncoder().encode(password)
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Import RSA public key
   */
  private async importPublicKey(base64Key: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(base64Key)
    return window.crypto.subtle.importKey(
      'spki',
      keyBuffer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    )
  }

  /**
   * Import RSA private key
   */
  private async importPrivateKey(base64Key: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(base64Key)
    return window.crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    )
  }

  /**
   * Get public key for sharing
   */
  getPublicKey(): string | null {
    return this.keyPair?.publicKey || null
  }

  /**
   * Check if encryption is enabled
   */
  isEnabled(): boolean {
    return this.isInitialized && this.keyPair !== null
  }

  /**
   * Clear keys (logout)
   */
  clear(): void {
    this.keyPair = null
    this.isInitialized = false
    localStorage.removeItem('aiulu_encryption_keys')
  }

  // Utility functions
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

// Export singleton instance
export const encryption = EncryptionManager.getInstance()
