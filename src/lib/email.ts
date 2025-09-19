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
      from: 'CinemaX <onboarding@resend.dev>',
      to: email,
      subject: '🎬 Your CinemaX Magic Link - Sign In Instantly',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to CinemaX</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%); min-height: 100vh;">
          
          <!-- Main Container -->
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            
            <!-- Email Card -->
            <div style="background: linear-gradient(135deg, #111111 0%, #1a1a1a 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
              
              <!-- Header Section -->
              <div style="background: linear-gradient(135deg, #e50914 0%, #b00710 100%); padding: 40px 40px 60px 40px; text-align: center; position: relative;">
                
                <!-- Background Pattern -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);"></div>
                
                <!-- Logo & Brand -->
                <div style="position: relative; z-index: 2;">
                  <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: rgba(255, 255, 255, 0.15); border-radius: 16px; margin-bottom: 20px; backdrop-filter: blur(10px);">
                    <span style="font-size: 32px;">🎬</span>
                  </div>
                  <h1 style="color: white; font-size: 36px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.02em; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">CINEMX</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); font-size: 18px; margin: 0; font-weight: 500;">Premium Movie Experience</p>
                </div>
              </div>
              
              <!-- Content Section -->
              <div style="padding: 50px 40px;">
                
                <!-- Welcome Message -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <h2 style="color: white; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.3;">
                    ✨ Your Magic Link is Ready!
                  </h2>
                  <p style="color: rgba(255, 255, 255, 0.8); font-size: 18px; line-height: 1.6; margin: 0; max-width: 400px; margin-left: auto; margin-right: auto;">
                    Click the button below to sign in instantly to your CinemaX account. No password needed!
                  </p>
                </div>
                
                <!-- Magic Button -->
                <div style="text-align: center; margin: 50px 0;">
                  <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                    <tr>
                      <td style="border-radius: 12px; background: linear-gradient(135deg, #e50914 0%, #b00710 100%); box-shadow: 0 8px 24px rgba(229, 9, 20, 0.4);">
                        <a href="${magicLinkUrl}" 
                           style="display: inline-block; 
                                  padding: 20px 40px; 
                                  color: white; 
                                  text-decoration: none; 
                                  font-weight: 700; 
                                  font-size: 18px;
                                  border-radius: 12px;
                                  letter-spacing: 0.02em;
                                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">
                           Sign in to CinemaX
                        </a>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- Security Notice -->
                <div style="background: rgba(229, 9, 20, 0.1); border: 1px solid rgba(229, 9, 20, 0.2); border-radius: 12px; padding: 20px; margin: 40px 0; text-align: center;">
                 
                  <p style="color: #e50914; font-size: 16px; font-weight: 600; margin: 0; line-height: 1.5;">
                    This magic link expires in 5 minutes for your security
                  </p>
                </div>
                <!-- Fallback Link Section -->
                <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 30px; margin-top: 40px;">
                  <h3 style="color: white; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
                    Button not working?
                  </h3>
                  <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 0 0 16px 0;">
                    Copy and paste this link into your browser:
                  </p>
                  <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 16px; word-break: break-all;">
                    <a href="${magicLinkUrl}" style="color: #e50914; font-size: 14px; text-decoration: none; font-family: monospace;">
                      ${magicLinkUrl}
                    </a>
                  </div>
                </div>
                
               
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding: 0 20px;">
              <p style="color: rgba(255, 255, 255, 0.3); font-size: 12px; margin: 0; line-height: 1.5;">
                © 2025 CinemaX. All rights reserved.<br>
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
