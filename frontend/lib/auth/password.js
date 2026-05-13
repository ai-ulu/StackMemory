export function validatePassword(password) {
  if (password.length < 8) return 'Şifre en az 8 karakter olmalı';
  if (!/[A-Z]/.test(password)) return 'Şifre en az bir büyük harf içermeli';
  if (!/[a-z]/.test(password)) return 'Şifre en az bir küçük harf içermeli';
  if (!/[0-9]/.test(password)) return 'Şifre en az bir rakam içermeli';
  return null;
}
