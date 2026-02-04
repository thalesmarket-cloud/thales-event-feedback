
export const generateEmailHTML = (appUrl: string = window.location.href) => {
  const primaryColor = '#0075B9';
  const secondaryColor = '#1CB3E7';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation : Votre avis nous intéresse - Thalès Informatique</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; }
    img { outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border: none; }
    table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .btn-container:hover { background-color: #005a8e !important; }
    .apple-link a { color: inherit !important; text-decoration: none !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <!-- Container Principal -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          
          <!-- Header Institutionnel -->
          <tr>
            <td align="center" style="background-color: ${primaryColor}; padding: 35px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Logo Stylisé -->
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background-color: #ffffff; width: 44px; height: 44px; border-radius: 6px; color: ${primaryColor}; font-weight: bold; font-size: 22px; line-height: 44px;">T</td>
                        <td style="padding-left: 15px; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">Thalès Informatique</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenu de l'Email -->
          <tr>
            <td style="padding: 45px 45px 30px 45px;">
              <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700; line-height: 1.3;">Comment s'est passée votre visite ?</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Bonjour,<br><br>
                Toute l'équipe de <strong>Thalès Informatique</strong> tient à vous remercier chaleureusement pour votre participation à notre Journée Portes Ouvertes.
              </p>
              <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 30px 0;">
                Afin de continuer à vous proposer des événements de qualité, nous aimerions recueillir votre feedback. Cela ne vous prendra pas plus de <strong>3 minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- BOUTON DE REDIRECTION (CTA) -->
          <tr>
            <td align="center" style="padding: 0 45px 50px 45px;">
              <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate !important;">
                <tr>
                  <td align="center" class="btn-container" style="background-color: ${primaryColor}; border-radius: 8px;">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 18px 36px; font-family: sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid ${primaryColor};">
                      Accéder au formulaire de satisfaction
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin-top: 20px; color: #94a3b8; font-size: 13px;">
                Lien direct : <a href="${appUrl}" style="color: ${primaryColor}; text-decoration: underline;">${appUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer Interne -->
          <tr>
            <td style="padding: 30px 45px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
                    <strong>Thalès Informatique - Département Événementiel</strong><br>
                    Ce sondage est strictement confidentiel.<br>
                    <span class="apple-link">123 Rue de l'Innovation, 75000 Paris</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Mentions Légales -->
        <table border="0" cellpadding="0" cellspacing="0" width="600">
          <tr>
            <td style="padding: 30px 20px; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Vous recevez ce message car vous vous êtes inscrit à la Journée Portes Ouvertes.<br>
                © ${new Date().getFullYear()} Thalès Informatique.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
