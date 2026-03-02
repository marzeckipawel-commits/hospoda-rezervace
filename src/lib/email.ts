import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.EMAIL_FROM ?? 'Hospoda <rezervace@example.com>';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export type ReservationEmailData = {
  eventName: string;
  eventDate: string;
  slotStartPrague: Date;
  type: 'DINE_IN' | 'TAKEAWAY';
  partySize: number | null;
  items: { name: string; quantity: number; priceCzk: number }[];
  totalCzk: number;
  manageToken: string;
};

export type AdminReservationNotificationKind = 'created' | 'updated' | 'cancelled';

export type AdminReservationNotificationData = {
  eventName: string;
  eventDate: string;
  slotStartPrague: Date;
  type: 'DINE_IN' | 'TAKEAWAY';
  partySize: number | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  note?: string | null;
  items: { name: string; quantity: number; priceCzk: number }[];
  totalCzk: number;
  publicCode: string;
  manageToken: string;
};

export async function sendReservationConfirmation(
  to: string,
  data: ReservationEmailData
): Promise<{ error: Error | null }> {
  console.log('RESEND KEY EXISTS:', !!process.env.RESEND_API_KEY);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM ?? '(fallback)');
  console.log('Sending email to:', to);

  if (!process.env.RESEND_API_KEY) {
    const err = new Error('RESEND_API_KEY is not set');
    console.error('RESEND CONFIG ERROR:', err.message);
    return { error: err };
  }

  if (!process.env.EMAIL_FROM) {
    const err = new Error('EMAIL_FROM is not set');
    console.error('RESEND CONFIG ERROR:', err.message);
    return { error: err };
  }

  const timeStr = data.slotStartPrague.toLocaleTimeString('cs-CZ', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
  });
  const manageUrl = `${baseUrl}/rezervace/sprava/${data.manageToken}`;

  const itemsList = data.items
    .filter((i) => i.quantity > 0)
    .map((i) => `  - ${i.name} × ${i.quantity} … ${i.priceCzk * i.quantity} Kč`)
    .join('\n');

  const textBody = `
Dobrý den,

potvrzujeme vaši rezervaci na akci ${data.eventName}.

Datum: ${data.eventDate}
Čas: ${timeStr} (Europe/Prague)
Typ: ${data.type === 'DINE_IN' ? 'Na místě' : 'S sebou'}
${data.partySize != null ? `Počet osob: ${data.partySize}` : ''}

${itemsList ? `Předobjednávka:\n${itemsList}` : ''}

Celková cena: ${data.totalCzk} Kč

Správa rezervace (úprava, zrušení): ${manageUrl}

Těšíme se na vás!
  `.trim();

  let logoUrl: string | null = null;
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    console.warn('EMAIL WARNING: NEXT_PUBLIC_BASE_URL is not set, using fallback baseUrl:', baseUrl);
  }
  logoUrl = process.env.BRAND_LOGO_URL || `${baseUrl}/logo.png`;

  const htmlBody = `
<!doctype html>
<html lang="cs">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Potvrzení rezervace – ${data.eventName}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;">
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:#f4f4f5;padding:16px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:24px 20px 16px 20px;text-align:center;">
                ${
                  logoUrl
                    ? `<div style="text-align:center;margin-bottom:16px;">
                        <img src="${logoUrl}" alt="Hospoda u Vavřince" style="max-width:160px;height:auto;display:block;margin:0 auto;" />
                      </div>`
                    : `<h1 style="margin:0 0 16px 0;font-size:24px;font-weight:700;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">Hospoda u Vavřince</h1>`
                }
                <h2 style="margin:0;font-size:20px;font-weight:600;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
                  Potvrzení rezervace
                </h2>
              </td>
            </tr>
            <tr>
              <td style="padding:0 20px 20px 20px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;font-size:14px;line-height:1.6;">
                <p style="margin:0 0 12px 0;">Dobrý den,</p>
                <p style="margin:0 0 12px 0;">
                  potvrzujeme vaši rezervaci na akci <strong>${data.eventName}</strong>.
                </p>
                <p style="margin:0 0 8px 0;">
                  <strong>Datum:</strong> ${data.eventDate}<br/>
                  <strong>Čas:</strong> ${timeStr} (Europe/Prague)<br/>
                  <strong>Typ:</strong> ${
                    data.type === 'DINE_IN' ? 'Na místě' : 'S sebou'
                  }<br/>
                  ${
                    data.partySize != null
                      ? `<strong>Počet osob:</strong> ${data.partySize}<br/>`
                      : ''
                  }
                </p>
                ${
                  itemsList
                    ? `<p style="margin:12px 0 8px 0;"><strong>Předobjednávka:</strong><br/>
                        <span style="white-space:pre-line;font-family:monospace;">${itemsList}</span>
                       </p>`
                    : ''
                }
                <p style="margin:12px 0 16px 0;">
                  <strong>Celková cena:</strong> ${data.totalCzk} Kč
                </p>
                <p style="margin:0 0 16px 0;">
                  Správa rezervace (úprava, zrušení):<br/>
                  <a href="${manageUrl}" style="color:#18181b;text-decoration:underline;">${manageUrl}</a>
                </p>
                <p style="margin:0;">Těšíme se na vás!</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 20px 18px 20px;text-align:center;background-color:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#71717a;">
                Hospoda u Vavřince · Rezervační systém
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from,
      to: [to],
      subject: `Potvrzení rezervace – ${data.eventName}`,
      text: textBody,
      html: htmlBody,
    });
    console.log('RESEND RESULT:', {
      id: (result as any)?.data?.id,
      error: result?.error,
    });

    if (result.error) {
      console.error('RESEND API ERROR:', result.error);
      return {
        error: new Error(result.error.message || 'Resend API error'),
      };
    }

    return { error: null };
  } catch (e) {
    const err: any = e;
    console.error('RESEND EXCEPTION:', {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
      statusCode: err?.statusCode,
      cause: err?.cause,
      details: err?.details,
    });
    return {
      error: new Error(err?.message || 'Resend exception'),
    };
  }
}

export async function sendAdminReservationNotification(
  to: string[],
  data: AdminReservationNotificationData,
  kind: AdminReservationNotificationKind
): Promise<{ error: Error | null }> {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    const err = new Error('Resend is not fully configured for admin notifications');
    console.error('RESEND ADMIN CONFIG ERROR:', err.message);
    return { error: err };
  }

  if (!to.length) {
    return { error: null };
  }

  const timeStr = data.slotStartPrague.toLocaleTimeString('cs-CZ', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
  });

  const kindLabel =
    kind === 'created' ? '[NOVÁ]' : kind === 'updated' ? '[ZMĚNA]' : '[ZRUŠENO]';
  const typeLabel = data.type === 'DINE_IN' ? 'Na místě' : 'S sebou';

  const manageUrl = `${baseUrl}/rezervace/sprava/${data.manageToken}`;
  const adminUrl = `${baseUrl}/admin/reservations`;

  const itemsList = data.items
    .filter((i) => i.quantity > 0)
    .map((i) => `  - ${i.name} × ${i.quantity} … ${i.priceCzk * i.quantity} Kč`)
    .join('\n');

  const textBody = `
${kindLabel} Rezervace – ${data.eventName}

Datum: ${data.eventDate}
Čas: ${timeStr} (Europe/Prague)
Typ: ${typeLabel}
${data.partySize != null ? `Počet osob: ${data.partySize}` : ''}

Jméno: ${data.firstName} ${data.lastName}
Telefon: ${data.phone}
E-mail: ${data.email}
Poznámka: ${data.note ?? '-'}

${data.type === 'TAKEAWAY' && itemsList ? `Předobjednávka:\n${itemsList}\n\nCelkem: ${data.totalCzk} Kč` : ''}

Veřejný kód: ${data.publicCode}

Správa rezervace (veřejné UI): ${manageUrl}
Admin přehled rezervací: ${adminUrl}
  `.trim();

  const htmlBody = `
<!doctype html>
<html lang="cs">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${kindLabel} Rezervace – ${data.eventName}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;">
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:#f4f4f5;padding:16px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:20px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;">
                <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#4b5563;">${kindLabel}</p>
                <h1 style="margin:0 0 4px 0;font-size:18px;font-weight:700;">
                  Rezervace – ${data.eventName}
                </h1>
                <p style="margin:0 0 16px 0;font-size:13px;color:#4b5563;">
                  ${data.eventDate} • ${timeStr} • ${typeLabel}
                </p>

                <h2 style="margin:0 0 8px 0;font-size:15px;font-weight:600;">Zákazník</h2>
                <p style="margin:0 0 8px 0;">
                  <strong>Jméno:</strong> ${data.firstName} ${data.lastName}<br/>
                  <strong>Telefon:</strong> ${data.phone}<br/>
                  <strong>E-mail:</strong> ${data.email}
                </p>

                <h2 style="margin:16px 0 8px 0;font-size:15px;font-weight:600;">Rezervace</h2>
                <p style="margin:0 0 8px 0;">
                  <strong>Čas:</strong> ${timeStr} (Europe/Prague)<br/>
                  <strong>Typ:</strong> ${typeLabel}<br/>
                  ${
                    data.partySize != null
                      ? `<strong>Počet osob:</strong> ${data.partySize}<br/>`
                      : ''
                  }
                  <strong>Veřejný kód:</strong> ${data.publicCode}
                </p>

                <p style="margin:0 0 8px 0;">
                  <strong>Poznámka:</strong> ${data.note ? data.note : '—'}
                </p>

                ${
                  data.type === 'TAKEAWAY' && itemsList
                    ? `<h2 style="margin:16px 0 8px 0;font-size:15px;font-weight:600;">Předobjednávka</h2>
                       <pre style="margin:0 0 8px 0;padding:8px 10px;background-color:#f4f4f5;border-radius:6px;font-size:12px;white-space:pre-wrap;">${itemsList}</pre>
                       <p style="margin:0 0 8px 0;"><strong>Celkem:</strong> ${data.totalCzk} Kč</p>`
                    : ''
                }

                <h2 style="margin:16px 0 8px 0;font-size:15px;font-weight:600;">Odkazy</h2>
                <p style="margin:0 0 4px 0;font-size:13px;">
                  <a href="${manageUrl}" style="color:#18181b;text-decoration:underline;">Správa rezervace (veřejné UI)</a>
                </p>
                <p style="margin:0 0 0 0;font-size:13px;">
                  <a href="${adminUrl}" style="color:#18181b;text-decoration:underline;">Admin přehled rezervací</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: `${kindLabel} Rezervace – ${data.eventName} – ${timeStr} – ${typeLabel}`,
      text: textBody,
      html: htmlBody,
    });
    console.log('RESEND ADMIN RESULT:', {
      id: (result as any)?.data?.id,
      error: result?.error,
    });

    if (result.error) {
      console.error('RESEND ADMIN API ERROR:', result.error);
      return {
        error: new Error(result.error.message || 'Resend admin API error'),
      };
    }

    return { error: null };
  } catch (e) {
    const err: any = e;
    console.error('RESEND ADMIN EXCEPTION:', {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
      statusCode: err?.statusCode,
      cause: err?.cause,
      details: err?.details,
    });
    return {
      error: new Error(err?.message || 'Resend admin exception'),
    };
  }
}

