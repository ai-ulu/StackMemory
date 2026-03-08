// Email templates and sending logic

export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
};

// Welcome email template
export function getWelcomeEmailHTML(userName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to StackMemory</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 30px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: white;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .feature {
      margin: 20px 0;
      padding: 15px;
      background: white;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🧠 StackMemory</div>
  </div>
  
  <div class="content">
    <h1>Hoş Geldin${userName ? `, ${userName}` : ''}! 🎉</h1>
    
    <p>StackMemory'e katıldığın için teşekkürler! Artık AI coding araçların proje bağlamını daha iyi hatırlayacak.</p>
    
    <div class="feature">
      <h3>🧠 İlk Hafızanı Oluştur</h3>
      <p>Chat sayfasına git ve AI ile konuşmaya başla. Önemli bilgiler otomatik olarak hafızaya alınacak.</p>
    </div>
    
    <div class="feature">
      <h3>🔍 Semantik Arama</h3>
      <p>Geçmiş konuşmalarını anlam bazlı ara. Sadece kelime eşleştirmesi değil, gerçek anlam arama.</p>
    </div>
    
    <div class="feature">
      <h3>🔒 Güvenlik</h3>
      <p>Verilen end-to-end şifreli. Sadece sen erişebilirsin.</p>
    </div>
    
    <center>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat" class="button">
        Hemen Başla →
      </a>
    </center>
    
    <h3>Hızlı Başlangıç İpuçları:</h3>
    <ul>
      <li>💬 AI ile konuş, önemli bilgileri paylaş</li>
      <li>🔍 Arama kutusunu kullanarak geçmiş hafızalarını bul</li>
      <li>📊 Memory Graph ile bilgi bağlantılarını gör</li>
      <li>⚙️ Settings'den API key oluştur (CLI/SDK için)</li>
    </ul>
    
    <p>Soruların mı var? <a href="${process.env.NEXT_PUBLIC_APP_URL}/help">Yardım Merkezi</a>'ni ziyaret et veya <a href="mailto:support@stackmemory.dev">support@stackmemory.dev</a> adresine yaz.</p>
    
    <p>İyi hatırlamalar! 🚀</p>
    <p><strong>StackMemory Ekibi</strong></p>
  </div>
  
  <div class="footer">
    <p>StackMemory - Shared memory for AI coding workflows</p>
    <p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}">Website</a> · 
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/docs">Docs</a> · 
      <a href="https://discord.gg/aiulu">Discord</a>
    </p>
    <p style="font-size: 12px; color: #999;">
      Bu emaili almak istemiyorsan <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">buradan</a> ayarlarını değiştirebilirsin.
    </p>
  </div>
</body>
</html>
  `;
}

// Send welcome email (using Supabase Edge Function or external service)
export async function sendWelcomeEmail(userEmail, userName) {
  try {
    // Option 1: Use Supabase Edge Function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: userEmail,
        subject: 'StackMemory\'e Hoş Geldin! 🎉',
        html: getWelcomeEmailHTML(userName),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return { success: true };
  } catch (error) {
    console.error('Send email error:', error);
    return { success: false, error: error.message };
  }
}

// Payment success email
export function getPaymentSuccessEmailHTML(plan, amount) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 10px;
      color: white;
      margin-bottom: 30px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 10px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Ödeme Başarılı!</h1>
  </div>
  
  <div class="content">
    <p>Merhaba,</p>
    
    <p><strong>${plan}</strong> planına yükseltme işlemin başarıyla tamamlandı!</p>
    
    <p><strong>Ödeme Detayları:</strong></p>
    <ul>
      <li>Plan: ${plan}</li>
      <li>Tutar: $${amount}</li>
      <li>Tarih: ${new Date().toLocaleDateString('tr-TR')}</li>
    </ul>
    
    <p>Artık tüm premium özelliklere erişebilirsin:</p>
    <ul>
      <li>✅ Sınırsız mesaj</li>
      <li>✅ Gelişmiş hafıza</li>
      <li>✅ Tüm AI modelleri</li>
      <li>✅ API erişimi</li>
      <li>✅ Öncelikli destek</li>
    </ul>
    
    <center>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat" class="button">
        Hemen Kullanmaya Başla →
      </a>
    </center>
    
    <p>Faturanı <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing">Billing</a> sayfasından indirebilirsin.</p>
    
    <p>Teşekkürler! 🙏</p>
    <p><strong>StackMemory Ekibi</strong></p>
  </div>
</body>
</html>
  `;
}
