"""
End-to-End Encryption Tests
"""
import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib.encryption import E2EEncryption, MemoryEncryption


class TestE2EEncryption:
    """E2EEncryption testleri"""
    
    def test_generate_key_pair(self):
        """Key pair oluşturma"""
        keys = E2EEncryption.generate_key_pair()
        
        assert keys is not None
        assert 'private_key' in keys
        assert 'public_key' in keys
        assert len(keys['private_key']) > 0
        assert len(keys['public_key']) > 0
    
    def test_encrypt_decrypt_data(self):
        """Veri şifreleme ve çözme"""
        # Key pair oluştur
        keys = E2EEncryption.generate_key_pair()
        assert keys is not None
        
        # Test verisi
        original_data = "Bu çok gizli bir mesajdır!"
        
        # Şifrele
        encrypted = E2EEncryption.encrypt_data(
            original_data,
            keys['public_key']
        )
        
        assert encrypted is not None
        assert encrypted != original_data
        
        # Çöz
        decrypted = E2EEncryption.decrypt_data(
            encrypted,
            keys['private_key']
        )
        
        assert decrypted == original_data
    
    def test_encrypt_with_wrong_key_fails(self):
        """Yanlış key ile çözme başarısız olmalı"""
        # İki farklı key pair
        keys1 = E2EEncryption.generate_key_pair()
        keys2 = E2EEncryption.generate_key_pair()
        
        # keys1 ile şifrele
        encrypted = E2EEncryption.encrypt_data(
            "Secret message",
            keys1['public_key']
        )
        
        # keys2 ile çözmeye çalış (başarısız olmalı)
        decrypted = E2EEncryption.decrypt_data(
            encrypted,
            keys2['private_key']
        )
        
        assert decrypted is None
    
    def test_password_encryption(self):
        """Password ile şifreleme"""
        password = "MySecurePassword123!"
        original_data = "Sensitive information"
        
        # Şifrele
        encrypted = E2EEncryption.encrypt_with_password(
            original_data,
            password
        )
        
        assert encrypted is not None
        assert 'encrypted' in encrypted
        assert 'salt' in encrypted
        assert 'iv' in encrypted
        
        # Çöz
        decrypted = E2EEncryption.decrypt_with_password(
            encrypted,
            password
        )
        
        assert decrypted == original_data
    
    def test_password_decryption_wrong_password_fails(self):
        """Yanlış password ile çözme başarısız olmalı"""
        correct_password = "CorrectPassword"
        wrong_password = "WrongPassword"
        
        encrypted = E2EEncryption.encrypt_with_password(
            "Secret data",
            correct_password
        )
        
        # Yanlış password ile çöz
        decrypted = E2EEncryption.decrypt_with_password(
            encrypted,
            wrong_password
        )
        
        assert decrypted is None


class TestMemoryEncryption:
    """MemoryEncryption testleri"""
    
    def test_encrypt_memory_with_key(self):
        """Memory şifreleme"""
        keys = E2EEncryption.generate_key_pair()
        mem_enc = MemoryEncryption(keys['public_key'])
        
        content = "Private memory content"
        encrypted = mem_enc.encrypt_memory(content)
        
        assert encrypted.startswith("E2EE:")
        assert encrypted != content
    
    def test_encrypt_memory_without_key(self):
        """Key olmadan memory şifreleme (plaintext)"""
        mem_enc = MemoryEncryption()
        
        content = "Public memory content"
        result = mem_enc.encrypt_memory(content)
        
        # Key yoksa plaintext olarak saklanır
        assert result == content
    
    def test_is_encrypted(self):
        """Şifreli içerik tespiti"""
        mem_enc = MemoryEncryption()
        
        assert mem_enc.is_encrypted("E2EE:abc123") is True
        assert mem_enc.is_encrypted("Plain text") is False
    
    def test_get_encrypted_content(self):
        """Şifreli içeriği alma"""
        mem_enc = MemoryEncryption()
        
        encrypted = "E2EE:abc123xyz"
        content = mem_enc.get_encrypted_content(encrypted)
        
        assert content == "abc123xyz"
        assert not content.startswith("E2EE:")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
