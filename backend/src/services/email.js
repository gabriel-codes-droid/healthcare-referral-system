const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@healthcare-referral.com';

// Send email via Resend REST API
async function sendViaResend(to, subject, text) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Resend error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// Fallback: console log when email is not configured
async function sendViaConsole(to, subject, text) {
  console.log('EMAIL SERVICE NOT CONFIGURED - Would send:');
  console.log(`From: ${EMAIL_FROM}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
  return { messageId: 'console-log' };
}

const sendVerificationEmail = async (email, code) => {
  const subject = 'Password Reset Verification Code';
  const text = `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.`;

  try {
    if (RESEND_API_KEY) {
      const result = await sendViaResend(email, subject, text);
      console.log(`Verification email sent to ${email} (id: ${result.id})`);
      return result;
    }

    await sendViaConsole(email, subject, text);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = { sendVerificationEmail };
