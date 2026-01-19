/**
 * AI-ULU Email Notifications
 * 
 * Email sending for reminders, alerts, and notifications.
 * Uses Resend API (or fallback to console in development).
 */

// Email templates
export const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'AI-ULU\'ya Hoş Geldiniz! 🧠',
    html: (name) => `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin: 0;">🧠 AI-ULU</h1>
          <p style="color: #666; margin: 5px 0;">Kişisel AI İşletim Sisteminiz</p>
        </div>
        
        <h2 style="color: #333;">Hoş geldin, ${name || 'değerli kullanıcı'}! 👋</h2>
        
        <p style="color: #555; line-height: 1.6;">
          AI-ULU'ya katıldığın için teşekkürler! Artık sizi gerçekten hatırlayan bir AI'ınız var.
        </p>
        
        <div style="background: #f8f4ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #8B5CF6; margin-top: 0;">Başlangıç için ipuçları:</h3>
          <ul style="color: #555; line-height: 1.8;">
            <li>💬 Sohbete başlayın ve AI'ya kendinizi tanıtın</li>
            <li>🧠 Tercihlerinizi ve ilgi alanlarınızı paylaşın</li>
            <li>🌐 Chrome Extension'ı kurun ve web'den bilgi kaydedin</li>
            <li>📊 Analytics'i ziyaret edin ve hafıza sağlığınızı takip edin</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://ai-ulu.com/chat" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Sohbete Başla →
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          AI-ULU - Sizi gerçekten hatırlayan yapay zeka<br />
          <a href="https://ai-ulu.com/unsubscribe" style="color: #999;">Abonelikten çık</a>
        </p>
      </div>
    `,
  },

  reminder: {
    subject: '⏰ AI-ULU Hatırlatma',
    html: (title, content, actionUrl) => `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #8B5CF6; margin: 0;">🧠 AI-ULU</h1>
        </div>
        
        <div style="background: #fff4e6; border-left: 4px solid #F59E0B; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <h3 style="color: #D97706; margin: 0 0 10px 0;">⏰ ${title}</h3>
          <p style="color: #555; margin: 0;">${content}</p>
        </div>
        
        ${actionUrl ? `
        <div style="text-align: center; margin-top: 20px;">
          <a href="${actionUrl}" style="background: #8B5CF6; color: white; padding: 10px 25px; border-radius: 6px; text-decoration: none;">
            Detayları Gör
          </a>
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          Bu hatırlatma AI-ULU hafızanız tarafından oluşturuldu.
        </p>
      </div>
    `,
  },

  memoryInsight: {
    subject: '📊 Hafıza Özeti - AI-ULU',
    html: (stats, insights) => `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #8B5CF6; margin: 0;">🧠 AI-ULU</h1>
          <p style="color: #666;">Haftalık Hafıza Özeti</p>
        </div>
        
        <div style="display: flex; justify-content: space-around; margin: 30px 0;">
          <div style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #8B5CF6;">${stats.totalMemories}</div>
            <div style="color: #666; font-size: 12px;">Toplam Hafıza</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #10B981;">${stats.newThisWeek}</div>
            <div style="color: #666; font-size: 12px;">Bu Hafta Yeni</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #06B6D4;">${stats.healthScore}%</div>
            <div style="color: #666; font-size: 12px;">Sağlık Puanı</div>
          </div>
        </div>
        
        <div style="background: #f8f4ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #8B5CF6; margin-top: 0;">✨ İçgörüler</h3>
          <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
            ${insights.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://ai-ulu.com/analytics" style="background: #8B5CF6; color: white; padding: 10px 25px; border-radius: 6px; text-decoration: none;">
            Detaylı Analiz →
          </a>
        </div>
      </div>
    `,
  },

  conflictAlert: {
    subject: '⚠️ Hafıza Çelişkisi Tespit Edildi - AI-ULU',
    html: (oldMemory, newMemory) => `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #8B5CF6; margin: 0;">🧠 AI-ULU</h1>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #F59E0B; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <h3 style="color: #D97706; margin: 0;">⚠️ Çelişki Tespit Edildi</h3>
        </div>
        
        <p style="color: #555;">Hafızanızda çelişen bilgiler bulundu:</p>
        
        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <strong style="color: #DC2626;">Eski Bilgi:</strong>
          <p style="color: #555; margin: 5px 0 0 0;">"${oldMemory}"</p>
        </div>
        
        <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <strong style="color: #16A34A;">Yeni Bilgi:</strong>
          <p style="color: #555; margin: 5px 0 0 0;">"${newMemory}"</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://ai-ulu.com/settings?tab=memories" style="background: #8B5CF6; color: white; padding: 10px 25px; border-radius: 6px; text-decoration: none;">
            Çelişkiyi Çöz
          </a>
        </div>
      </div>
    `,
  },
};

/**
 * Send email using Resend API
 */
export async function sendEmail({ to, subject, html, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    // Development fallback - log to console
    console.log('📧 EMAIL (dev mode):');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Content: ${html.slice(0, 200)}...`);
    return { success: true, dev: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'AI-ULU <noreply@ai-ulu.com>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email, name) {
  const template = EMAIL_TEMPLATES.welcome;
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html(name),
  });
}

/**
 * Send reminder email
 */
export async function sendReminderEmail(email, title, content, actionUrl) {
  const template = EMAIL_TEMPLATES.reminder;
  return sendEmail({
    to: email,
    subject: `${template.subject}: ${title}`,
    html: template.html(title, content, actionUrl),
  });
}

/**
 * Send weekly memory insight email
 */
export async function sendMemoryInsightEmail(email, stats, insights) {
  const template = EMAIL_TEMPLATES.memoryInsight;
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html(stats, insights),
  });
}

/**
 * Send conflict alert email
 */
export async function sendConflictAlertEmail(email, oldMemory, newMemory) {
  const template = EMAIL_TEMPLATES.conflictAlert;
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html(oldMemory, newMemory),
  });
}

export default {
  sendEmail,
  sendWelcomeEmail,
  sendReminderEmail,
  sendMemoryInsightEmail,
  sendConflictAlertEmail,
  EMAIL_TEMPLATES,
};
