# Move Repo and Landing Page to PulseFlow-App Organization

Steps to move [LuminaEnvision/PulseFlow-App](https://github.com/LuminaEnvision/PulseFlow-App) and the Pulse landing page to the [PulseFlow-App](https://github.com/PulseFlow-App) organization.

---

## 1. Move the main repo (PulseFlow-App) to the org

You need **admin** on both the personal repo and the organization.

1. **Open the repo to transfer**  
   Go to [github.com/LuminaEnvision/PulseFlow-App](https://github.com/LuminaEnvision/PulseFlow-App).

2. **Open Settings**  
   **Settings** → scroll to the bottom → **Danger Zone**.

3. **Transfer ownership**  
   - Click **Transfer ownership**.
   - In **New owner**, choose **PulseFlow-App** (your org).
   - In **Repository name**, you can keep **PulseFlow-App** or rename (e.g. **PulseFlow-App**). The URL will become `https://github.com/PulseFlow-App/PulseFlow-App` (or whatever name you pick).
   - Type the repo name to confirm.
   - Click **I understand, transfer this repository**.

4. **Update your local clone**  
   After the transfer, GitHub redirects the old URL to the new one. Update your local remote if you had the old URL:

   ```bash
   git remote set-url origin https://github.com/PulseFlow-App/PulseFlow-App.git
   # or, if you renamed the repo:
   # git remote set-url origin https://github.com/PulseFlow-App/YOUR_REPO_NAME.git
   git fetch origin
   ```

5. **Update any CI/CD or deploy configs**  
   If GitHub Actions, Vercel, Railway, or other services point at `LuminaEnvision/PulseFlow-App`, update them to the new org URL (e.g. `PulseFlow-App/PulseFlow-App`).

---

## 2. Move the Pulse Landing page to the org

It depends where the landing page lives.

### If the landing is a separate GitHub repo

(e.g. `LuminaEnvision/pulse-landing` or `LuminaEnvision/pulseflow-site`)

- Use the same flow as above: **Settings** → **Danger Zone** → **Transfer ownership** → choose **PulseFlow-App**.
- Then update the local remote and any deploy/CI links to the new org URL.

### If the landing is inside this monorepo

- The README describes **apps/web** as the web app (pulseflow.site), currently a placeholder. Moving **this** repo to the org (step 1) is enough — the landing code moves with it.
- After the transfer, point your hosting (e.g. Vercel) at the new repo: `PulseFlow-App/PulseFlow-App` (or the name you chose), and set the project root to `apps/web` if needed.

### If the landing is deployed elsewhere (e.g. Vercel) from this repo

- After transferring the repo (step 1), in Vercel (or similar): **Project Settings** → **Git** → **Connect Git Repository** (or reconnect) and select **PulseFlow-App/PulseFlow-App**. No need to move a second repo.

---

## 3. Checklist after the move

- [ ] Main repo is under [github.com/PulseFlow-App](https://github.com/PulseFlow-App).
- [ ] Local `git remote` points to the new org URL.
- [ ] Any second repo (landing, if separate) is transferred to the org.
- [ ] CI/CD (Actions, etc.) uses the new repo URL.
- [ ] Hosting (Vercel, Netlify, etc.) is connected to the org repo.
- [ ] Links in README, docs, and marketing that pointed at `LuminaEnvision/PulseFlow-App` are updated to the org URL (optional; GitHub redirects the old URL for a while).

---

## References

- [GitHub: Transferring a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)
- Org: [github.com/PulseFlow-App](https://github.com/PulseFlow-App)
