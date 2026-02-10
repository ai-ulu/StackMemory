/**
 * End-to-End Encryption (E2EE) - Client-Side
 * Veriler browser'da şifrelenir, sadece kullanıcı açabilir
 */

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
}

export class E2EEncryption {
  /**
   * RSA key pair oluştur (browser'da)
   * Private key ASLA server'a gönderilmez!
   */
  static async generateKeyPair(): Promise<KeyPair | null> {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      const publicKey = await window.crypto.subtle.exportKey(
        'spki',
        keyPair.publicKey
      );
      
      const privateKey = await window.crypto.subtle.exportKey(
        'pkcs8',
        keyPair.privateKey
      );

      return {
        publicKey: this.arrayBufferToBase64(publicKey),
        privateKey: this.arrayBufferToBase64(privateKey),
      };
    } catch (error) {
      console.error('Error generating key pair:', error);
      return null;
    }
  }

  /**
   * Veriyi public key ile şifrele
   * Server bu veriyi okuyamaz!
   */
  static async encryptData(
    data: string,
    publicKeyBase64: string
  ): Promise<string | null> {
    try {
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKeyBase64);
      
      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        dataBuffer
      );

      return this.arrayBufferToBase64(encrypted);
    } catch (error) {
      console.error('Error encrypting data:', error);
      return null;
    }
  }

  /**
   * Veriyi private key ile çöz
   * Sadece kullanıcı çözebilir!
   */
  static async decryptData(
    encryptedBase64: string,
    privateKeyBase64: string
  ): Promise<string | null> {
    try {
      const privateKeyBuffer = this.base64ToArrayBuffer(privateKeyBase64);
      
      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['decrypt']
      );

      const encryptedBuffer = this.base64ToArrayBuffer(encryptedBase64);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKey,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      return null;
    }
  }

  /**
   * Password'den key türet
   */
  static async deriveKeyFromPassword(
    password: string,
    salt?: Uint8Array
  ): Promise<{ key: CryptoKey; salt: Uint8Array } | null> {
    try {
      if (!salt) {
        salt = window.crypto.getRandomValues(new Uint8Array(16));
      }

      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);

      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-CBC', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      return { key, salt };
    } catch (error) {
      console.error('Error deriving key:', error);
      return null;
    }
  }

  /**
   * Password ile şifrele (symmetric)
   */
  static async encryptWithPassword(
    data: string,
    password: string
  ): Promise<EncryptedData | null> {
    try {
      const derived = await this.deriveKeyFromPassword(password);
      if (!derived) return null;

      const { key, salt } = derived;
      const iv = window.crypto.getRandomValues(new Uint8Array(16));

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'AES-CBC',
          iv: iv,
        },
        key,
        dataBuffer
      );

      return {
        encrypted: this.arrayBufferToBase64(encrypted),
        salt: this.arrayBufferToBase64(salt),
        iv: this.arrayBufferToBase64(iv),
      };
    } catch (error) {
      console.error('Error encrypting with password:', error);
      return null;
    }
  }

  /**
   * Password ile çöz (symmetric)
   */
  static async decryptWithPassword(
    encryptedData: EncryptedData,
    password: string
  ): Promise<string | null> {
    try {
      const salt = this.base64ToArrayBuffer(encryptedData.salt);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const encrypted = this.base64ToArrayBuffer(encryptedData.encrypted);

      const derived = await this.deriveKeyFromPassword(
        password,
        new Uint8Array(salt)
      );
      if (!derived) return null;

      const { key } = derived;

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-CBC',
          iv: new Uint8Array(iv),
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Error decrypting with password:', error);
      return null;
    }
  }

  // Helper functions
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Memory-specific encryption wrapper
 */
export class MemoryEncryption {
  private userPublicKey: string | null = null;
  private userPrivateKey: string | null = null;

  constructor(publicKey?: string, privateKey?: string) {
    this.userPublicKey = publicKey || null;
    this.userPrivateKey = privateKey || null;
  }

  /**
   * Key pair'i localStorage'a kaydet
   * UYARI: Production'da daha güvenli storage kullan!
   */
  saveKeys(publicKey: string, privateKey: string): void {
    this.userPublicKey = publicKey;
    this.userPrivateKey = privateKey;
    
    // Private key'i güvenli sakla (örnek: encrypted localStorage)
    localStorage.setItem('e2ee_public_key', publicKey);
    // UYARI: Private key'i plaintext olarak saklama!
    // Production'da: IndexedDB + master password ile şifrele
    console.warn('Private key storage needs secure implementation!');
  }

  /**
   * Key pair'i yükle
   */
  loadKeys(): boolean {
    const publicKey = localStorage.getItem('e2ee_public_key');
    const privateKey = localStorage.getItem('e2ee_private_key');
    
    if (publicKey && privateKey) {
      this.userPublicKey = publicKey;
      this.userPrivateKey = privateKey;
      return true;
    }
    
    return false;
  }

  /**
   * Memory içeriğini şifrele
   */
  async encryptMemory(content: string): Promise<string> {
    if (!this.userPublicKey) {
      console.warn('No public key, storing unencrypted');
      return content;
    }

    const encrypted = await E2EEncryption.encryptData(
      content,
      this.userPublicKey
    );
    
    if (encrypted) {
      return `E2EE:${encrypted}`;
    }

    return content;
  }

  /**
   * Memory içeriğini çöz
   */
  async decryptMemory(content: string): Promise<string> {
    if (!this.isEncrypted(content)) {
      return content;
    }

    if (!this.userPrivateKey) {
      console.error('No private key, cannot decrypt');
      return '[ENCRYPTED - No Key]';
    }

    const encryptedContent = content.substring(5); // "E2EE:" prefix'ini çıkar
    const decrypted = await E2EEncryption.decryptData(
      encryptedContent,
      this.userPrivateKey
    );

    return decrypted || '[DECRYPTION FAILED]';
  }

  /**
   * İçerik şifreli mi?
   */
  isEncrypted(content: string): boolean {
    return content.startsWith('E2EE:');
  }
}
