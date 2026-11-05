import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isMarketplaceHost } from "@/lib/pros/paths";
import { sendAppEmail } from "@/lib/email/send";

const CONFIRM_NEXT = new Set(["/", "/settings", "/setup-passkey", "/home"]);

const COPY: Record<string, { subject: string; title: string; body: string; button: string }> = {
  en: {
    subject: "Confirm your email",
    title: "Confirm your email",
    body: "Open this link to finish creating your account.",
    button: "Confirm email",
  },
  th: {
    subject: "ยืนยันอีเมลของคุณ",
    title: "ยืนยันอีเมลของคุณ",
    body: "เปิดลิงก์นี้เพื่อสร้างบัญชีให้เสร็จ",
    button: "ยืนยันอีเมล",
  },
  fr: {
    subject: "Confirmez votre e-mail",
    title: "Confirmez votre e-mail",
    body: "Ouvrez ce lien pour terminer la création du compte.",
    button: "Confirmer l’e-mail",
  },
  de: {
    subject: "E-Mail bestätigen",
    title: "E-Mail bestätigen",
    body: "Öffnen Sie diesen Link, um das Konto fertigzustellen.",
    button: "E-Mail bestätigen",
  },
  es: {
    subject: "Confirme su correo",
    title: "Confirme su correo",
    body: "Abra este enlace para terminar de crear la cuenta.",
    button: "Confirmar correo",
  },
  it: {
    subject: "Conferma la tua email",
    title: "Conferma la tua email",
    body: "Apri questo link per completare la creazione dell’account.",
    button: "Conferma email",
  },
  ru: {
    subject: "Подтвердите почту",
    title: "Подтвердите почту",
    body: "Откройте эту ссылку, чтобы закончить создание аккаунта.",
    button: "Подтвердить почту",
  },
  he: {
    subject: "אשרו את האימייל",
    title: "אשרו את האימייל",
    body: "פתחו את הקישור כדי לסיים את יצירת החשבון.",
    button: "אישור אימייל",
  },
  ar: {
    subject: "أكد بريدك",
    title: "أكد بريدك",
    body: "افتح هذا الرابط لإكمال إنشاء الحساب.",
    button: "تأكيد البريد",
  },
  my: {
    subject: "အီးမေးလ်ကို အတည်ပြုပါ",
    title: "အီးမေးလ်ကို အတည်ပြုပါ",
    body: "အကောင့်ဖွင့်ခြင်း ပြီးစေရန် ဤလင့်ခ်ကို ဖွင့်ပါ။",
    button: "အီးမေးလ် အတည်ပြုမည်",
  },
  tr: {
    subject: "E-postanızı onaylayın",
    title: "E-postanızı onaylayın",
    body: "Hesabı tamamlamak için bu bağlantıyı açın.",
    button: "E-postayı onayla",
  },
};

export function requestHost(request: Request) {
  return (
    (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
      .split(",")[0]
      ?.trim() ?? ""
  );
}

export function requestOrigin(request: Request) {
  const host = requestHost(request);
  const proto =
    (request.headers.get("x-forwarded-proto") ?? "https").split(",")[0]?.trim() || "https";
  if (host) return `${proto}://${host}`;
  return "https://app.pulseflow.site";
}

export function isServicesRequest(request: Request) {
  return isMarketplaceHost(requestHost(request));
}

export function safeConfirmNext(raw: string | null | undefined, marketplace: boolean) {
  const fallback = marketplace ? "/" : "/setup-passkey";
  if (!raw || !CONFIRM_NEXT.has(raw)) return fallback;
  return raw;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendRegistrationConfirm(
  admin: SupabaseClient,
  request: Request,
  input: { email: string; locale?: string | null; nextPath: string },
): Promise<{ sent: boolean; error?: string }> {
  const origin = requestOrigin(request);
  const marketplace = isServicesRequest(request);
  const nextPath = safeConfirmNext(input.nextPath, marketplace);
  const finishUrl = `${origin}/auth/finish?next=${encodeURIComponent(nextPath)}`;

  if (process.env.RESEND_API_KEY?.trim()) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: input.email,
      options: { redirectTo: `${origin}/auth/confirm` },
    });
    const token = data?.properties?.hashed_token;
    const type = data?.properties?.verification_type || "magiclink";
    if (!error && token) {
      const link = `${origin}/auth/confirm?token_hash=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(nextPath)}`;
      const copy = COPY[input.locale ?? ""] ?? COPY.en;
      const product = marketplace ? "Pulseflow Services" : "Pulse Flow";
      const mail = await sendAppEmail({
        to: input.email,
        subject: `${copy.subject} — ${product}`,
        text: `${copy.body}\n\n${link}\n`,
        html: `<p>${escapeHtml(copy.body)}</p><p><a href="${escapeHtml(link)}">${escapeHtml(copy.button)}</a></p>`,
      });
      if (mail.sent) return mail;
      console.warn("[email] Resend did not send the confirmation", mail.error);
    }
  }

  return sendWithSupabase(input.email, finishUrl);
}

/** Supabase Auth sends this from its own mail. It does not need Resend. */
async function sendWithSupabase(email: string, redirectTo: string): Promise<{ sent: boolean; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { sent: false, error: "Auth email is not configured." };

  const client = createClient(url, key, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false },
  });
  const first = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
  });
  if (!first.error) return { sent: true };

  const second = await client.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (!second.error) return { sent: true };
  return { sent: false, error: second.error.message || first.error.message };
}
