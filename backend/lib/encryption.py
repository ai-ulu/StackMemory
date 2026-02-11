"""
End-to-End Encryption (E2EE) Module
Veriler client-side'da şifrelenir, sadece kullanıcı açabilir
"""
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import base64
import os
import logging

logger = logging.getLogger(__name__)


class E2EEncryption:
    """End-to-End Encryption - Client-side encryption"""
    
    @staticmethod
    def generate_key_pair():
        """RSA key pair oluştur (client-side için)"""
        try:
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
            
            public_key = private_key.public_key()
            
            # PEM formatına çevir
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            return {
                'private_key': base64.b64encode(private_pem).decode('utf-8'),
                'public_key': base64.b64encode(public_pem).decode('utf-8')
            }
            
        except Exception as e:
            logger.error(f"Error generating key pair: {e}")
            return None
    
    @staticmethod
    def encrypt_data(data: str, public_key_b64: str) -> str:
        """
        Veriyi public key ile şifrele (client-side)
        Server bu veriyi okuyamaz!
        """
        try:
            # Public key'i decode et
            public_pem = base64.b64decode(public_key_b64)
            public_key = serialization.load_pem_public_key(
                public_pem,
                backend=default_backend()
            )
            
            # Veriyi şifrele
            encrypted = public_key.encrypt(
                data.encode('utf-8'),
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            # Base64 encode
            return base64.b64encode(encrypted).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error encrypting data: {e}")
            return None
    
    @staticmethod
    def decrypt_data(encrypted_data_b64: str, private_key_b64: str) -> str:
        """
        Veriyi private key ile çöz (client-side)
        Sadece kullanıcı çözebilir!
        """
        try:
            # Private key'i decode et
            private_pem = base64.b64decode(private_key_b64)
            private_key = serialization.load_pem_private_key(
                private_pem,
                password=None,
                backend=default_backend()
            )
            
            # Encrypted data'yı decode et
            encrypted = base64.b64decode(encrypted_data_b64)
            
            # Veriyi çöz
            decrypted = private_key.decrypt(
                encrypted,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            return decrypted.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error decrypting data: {e}")
            return None
    
    @staticmethod
    def derive_key_from_password(password: str, salt: bytes = None) -> tuple:
        """
        Password'den encryption key türet (client-side)
        """
        try:
            if salt is None:
                salt = os.urandom(16)
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend()
            )
            
            key = kdf.derive(password.encode('utf-8'))
            
            return key, salt
            
        except Exception as e:
            logger.error(f"Error deriving key: {e}")
            return None, None
    
    @staticmethod
    def encrypt_with_password(data: str, password: str) -> dict:
        """
        Password ile şifrele (symmetric encryption)
        """
        try:
            # Key türet
            key, salt = E2EEncryption.derive_key_from_password(password)
            if key is None:
                return None
            
            # IV oluştur
            iv = os.urandom(16)
            
            # Şifrele
            cipher = Cipher(
                algorithms.AES(key),
                modes.CBC(iv),
                backend=default_backend()
            )
            
            encryptor = cipher.encryptor()
            
            # Padding ekle
            data_bytes = data.encode('utf-8')
            padding_length = 16 - (len(data_bytes) % 16)
            padded_data = data_bytes + bytes([padding_length] * padding_length)
            
            encrypted = encryptor.update(padded_data) + encryptor.finalize()
            
            return {
                'encrypted': base64.b64encode(encrypted).decode('utf-8'),
                'salt': base64.b64encode(salt).decode('utf-8'),
                'iv': base64.b64encode(iv).decode('utf-8')
            }
            
        except Exception as e:
            logger.error(f"Error encrypting with password: {e}")
            return None
    
    @staticmethod
    def decrypt_with_password(encrypted_data: dict, password: str) -> str:
        """
        Password ile çöz (symmetric decryption)
        """
        try:
            # Decode
            encrypted = base64.b64decode(encrypted_data['encrypted'])
            salt = base64.b64decode(encrypted_data['salt'])
            iv = base64.b64decode(encrypted_data['iv'])
            
            # Key türet
            key, _ = E2EEncryption.derive_key_from_password(password, salt)
            if key is None:
                return None
            
            # Çöz
            cipher = Cipher(
                algorithms.AES(key),
                modes.CBC(iv),
                backend=default_backend()
            )
            
            decryptor = cipher.decryptor()
            decrypted_padded = decryptor.update(encrypted) + decryptor.finalize()
            
            # Padding çıkar
            padding_length = decrypted_padded[-1]
            
            # Geçersiz padding kontrolü
            if padding_length > 16 or padding_length < 1:
                logger.error("Invalid padding - wrong password")
                return None
            
            decrypted = decrypted_padded[:-padding_length]
            
            return decrypted.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error decrypting with password: {e}")
            return None


class MemoryEncryption:
    """Memory-specific encryption wrapper"""
    
    def __init__(self, user_public_key: str = None):
        """
        Args:
            user_public_key: User's public key (base64)
        """
        self.user_public_key = user_public_key
        self.e2ee = E2EEncryption()
    
    def encrypt_memory(self, content: str) -> str:
        """
        Memory içeriğini şifrele
        Server bu içeriği okuyamaz!
        """
        if not self.user_public_key:
            logger.warning("No public key provided, storing unencrypted")
            return content
        
        encrypted = self.e2ee.encrypt_data(content, self.user_public_key)
        if encrypted:
            return f"E2EE:{encrypted}"
        
        return content
    
    def is_encrypted(self, content: str) -> bool:
        """İçerik şifreli mi?"""
        return content.startswith("E2EE:")
    
    def get_encrypted_content(self, content: str) -> str:
        """Şifreli içeriği al (prefix olmadan)"""
        if self.is_encrypted(content):
            return content[5:]  # "E2EE:" prefix'ini çıkar
        return content
