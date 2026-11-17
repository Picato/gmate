export type MailEnv = {
  readonly RESEND_API_KEY?: string | undefined;
  readonly MAIL_FROM?: string | undefined;
};

/** Without RESEND_API_KEY (local dev) the link is logged instead of mailed. */
export async function sendLoginLink(env: MailEnv, to: string, link: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[gmate] login link for ${to}: ${link}`);
    return;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM ?? 'gmate <onboarding@resend.dev>',
      to,
      subject: 'Your gmate login link',
      text: `Open this link to log in to gmate. It works for 15 minutes.\n\n${link}\n\nIf you did not ask for it, ignore this email.`,
      html: `<p>Open this link to log in to gmate. It works for 15 minutes.</p><p><a href="${link}">Log in to gmate</a></p><p>If you did not ask for it, ignore this email.</p>`,
    }),
  });
  if (!response.ok) console.error(`[gmate] Resend failed: ${response.status} ${await response.text()}`);
}
