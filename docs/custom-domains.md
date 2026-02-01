# Custom Domains — pulseflow.site

You have **pulseflow.site** registered. Use subdomains so the landing and app live on the same domain:

- **Landing:** `https://pulseflow.site` (already deployed)
- **App:** `https://app.pulseflow.site`

This doc covers adding **app.pulseflow.site** to the project that serves the app (e.g. on Vercel).

---

## 1. Add the domain in Vercel (app project)

1. Open the [Vercel Dashboard](https://vercel.com/dashboard) and select the **project** that serves the app (not the landing).
2. Go to **Settings** → **Domains**.
3. Click **Add** (or **Add Domain**).
4. Enter: **`app.pulseflow.site`**.
5. Save. Vercel will show the DNS record you need.

---

## 2. Add DNS at your registrar

Where you manage DNS for **pulseflow.site** (e.g. Cloudflare, Namecheap, Vercel Domains, etc.):

- **Type:** `CNAME`
- **Name / Host:** `app` (or `app.pulseflow.site` if the registrar shows the full name)
- **Value / Target:** the value Vercel shows for this project (e.g. `cname.vercel-dns.com` or a project-specific target like `xxxx.vercel-dns-017.com`)

Save the record. If your registrar uses a “proxy” or “CDN” toggle for the CNAME, you can leave it on or off; Vercel will still issue SSL.

---

## 3. Wait for verification

Vercel checks DNS every so often. When the CNAME is correct, the domain in **Settings → Domains** will show as verified and **HTTPS** will work automatically.

If the domain was used by another Vercel account, you may need to add a **TXT** record first to verify ownership; the dashboard will show the exact record.

---

## Summary

| Where        | What to do |
|-------------|------------|
| **Vercel**  | Project → Settings → Domains → Add **app.pulseflow.site** |
| **DNS**     | CNAME **app** → target Vercel gives you (e.g. `cname.vercel-dns.com`) |

Reference: [Vercel — Adding & configuring a custom domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) (subdomains use CNAME).
