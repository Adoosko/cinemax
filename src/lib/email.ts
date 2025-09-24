import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail({
  email,
  magicLinkUrl,
}: {
  email: string;
  magicLinkUrl: string;
}) {
  try {
    const data = await resend.emails.send({
      from: 'CINEMX <cinemx@adrianfinik.sk>',
      to: email,
      subject: '🎬 Your CiNEMX Magic Link - Sign In Instantly',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to CinemaX</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #000000; min-height: 100vh;">

          <!-- Main Container -->
          <div style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">

            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 40px;">
              ${process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL ?
                `<img src="${process.env.NEXT_PUBLIC_APP_URL}/text-logo.png" alt="CINEMX" style="max-width: 200px; height: auto;">` :
                `<div style="font-size: 32px; font-weight: 700; color: white; letter-spacing: -0.02em;">CINEMX</div>`
              }
            </div>

            <!-- Content Card -->
            <div style="background: #111111; border: 1px solid #333333; border-radius: 12px; overflow: hidden;">

              <!-- Header -->
              <div style="background: linear-gradient(135deg, #e50914 0%, #b00710 100%); padding: 30px 30px 20px 30px; text-align: center;">
                <h1 style="color: white; font-size: 24px; font-weight: 600; margin: 0; letter-spacing: -0.01em;">
                  Your Magic Link
                </h1>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">

                <!-- Message -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <p style="color: #cccccc; font-size: 16px; line-height: 1.5; margin: 0;">
                    Click the button below to sign in to your CinemaX account instantly. No password required.
                  </p>
                </div>

                <!-- Magic Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                    <tr>
                      <td style="border-radius: 8px; background: linear-gradient(135deg, #e50914 0%, #b00710 100%); box-shadow: 0 4px 16px rgba(229, 9, 20, 0.3);">
                        <a href="${magicLinkUrl}"
                           style="display: inline-block;
                                  padding: 16px 32px;
                                  color: white;
                                  text-decoration: none;
                                  font-weight: 600;
                                  font-size: 16px;
                                  border-radius: 8px;
                                  letter-spacing: 0.02em;">
                           Sign In Now
                        </a>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Security Notice -->
                <div style="background: rgba(229, 9, 20, 0.05); border: 1px solid rgba(229, 9, 20, 0.2); border-radius: 8px; padding: 16px; margin: 30px 0; text-align: center;">
                  <p style="color: #cccccc; font-size: 14px; margin: 0; line-height: 1.4;">
                    This link expires in 5 minutes for your security
                  </p>
                </div>

                <!-- Fallback Link -->
                <div style="border-top: 1px solid #333333; padding-top: 24px; margin-top: 30px;">
                  <h3 style="color: white; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
                    Link not working?
                  </h3>
                  <p style="color: #888888; font-size: 13px; margin: 0 0 12px 0;">
                    Copy and paste this URL into your browser:
                  </p>
                  <div style="background: #1a1a1a; border: 1px solid #333333; border-radius: 6px; padding: 12px; word-break: break-all;">
                    <a href="${magicLinkUrl}" style="color: #e50914; font-size: 13px; text-decoration: none; font-family: monospace;">
                      ${magicLinkUrl}
                    </a>
                  </div>
                </div>

              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding: 0 20px;">
              <p style="color: #666666; font-size: 12px; margin: 0; line-height: 1.5;">
                © 2025 CinemaX. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send magic link email:', error);
    return { success: false, error };
  }
}
