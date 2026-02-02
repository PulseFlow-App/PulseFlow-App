import { Link } from 'react-router-dom';
import styles from './LegalPage.module.css';

export function Privacy() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← Back</Link>
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: 2026-02-02</p>
        <div className={styles.content}>
          <h2>1. Who We Are</h2>
          <p>Pulse ("we", "our") is a wellness and routine app. This Privacy Policy explains how we collect, use, and protect your information when you use the Pulse app and related services.</p>

          <h2>2. Data We Collect</h2>
          <ul>
            <li><strong>Account data:</strong> Email (and optionally wallet address if you connect a wallet), used to identify you and provide the service.</li>
            <li><strong>Usage and product data:</strong> Body signals (e.g. sleep, energy, mood), check-ins, and other data you enter in the App, used to provide insights and the Daily Pulse score.</li>
            <li><strong>Technical data:</strong> Device type, app version, and similar technical information, used to operate and improve the service.</li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <ul>
            <li>To provide and improve the Pulse app (e.g. insights, trends, personalization).</li>
            <li>To communicate with you about your account or the service, where permitted.</li>
            <li>We do <strong>not</strong> sell your personal data. We do <strong>not</strong> use your data for third-party advertising.</li>
          </ul>

          <h2>4. Data Sharing</h2>
          <p>We do not sell or rent your personal data. We may share data only with service providers that help us run the App (e.g. hosting, analytics), under strict agreements; when required by law or to protect rights and safety; or with your consent where applicable.</p>

          <h2>5. Data Security and Retention</h2>
          <p>We use encryption in transit and at rest where applicable. We retain your data while your account is active and as needed to provide the service and comply with law. You can request deletion of your data or account; we will process such requests in line with applicable law.</p>

          <h2>6. Your Rights</h2>
          <p>Depending on where you live, you may have the right to access, correct, or delete your personal data; export your data; object to or restrict certain processing; or withdraw consent. Contact us (via the App or pulseflow.site) to exercise these rights.</p>

          <h2>7. Children</h2>
          <p>The App is not directed at children under 13 (or higher where required). We do not knowingly collect data from children. If you believe we have collected such data, please contact us so we can delete it.</p>

          <h2>8. Changes</h2>
          <p>We may update this Privacy Policy from time to time. We will post the updated policy at this URL and update the "Last updated" date. Continued use after changes constitutes acceptance.</p>

          <h2>9. Contact</h2>
          <p>For privacy questions or requests, contact us via the support or contact option in the App or at pulseflow.site.</p>
        </div>
      </main>
    </div>
  );
}
