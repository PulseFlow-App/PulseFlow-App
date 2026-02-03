import { Link } from 'react-router-dom';
import styles from './LegalPage.module.css';

export function Terms() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← Back</Link>
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: 2026-02-02</p>
        <div className={styles.content}>
          <h2>1. Acceptance</h2>
          <p>By using Pulse ("the App"), you agree to these Terms of Service ("Terms"). If you do not agree, do not use the App.</p>

          <h2>2. Description of Service</h2>
          <p>Pulse is a wellness and routine app that helps you track body signals (e.g. sleep, energy, mood), run daily check-ins, and view insights. The App is not a medical device and does not provide medical advice, diagnosis, or treatment.</p>

          <h2>3. Account and Use</h2>
          <ul>
            <li>You must provide accurate information when signing up.</li>
            <li>You are responsible for keeping your account credentials secure.</li>
            <li>You may not use the App for any illegal purpose or in a way that harms others or the service.</li>
          </ul>

          <h2>4. Data and Privacy</h2>
          <p>Your use of the App is also governed by our <Link to="/privacy">Privacy Policy</Link>. We process data as described there and do not sell your personal data.</p>

          <h2>5. Disclaimer of Medical Advice</h2>
          <p>The App and any insights or suggestions are for <strong>informational and educational purposes only</strong>. They are not a substitute for professional medical, nutritional, or fitness advice. Always consult a qualified professional for health-related decisions.</p>

          <h2>6. Limitation of Liability</h2>
          <p>To the extent permitted by law, Pulse and its providers are not liable for any indirect, incidental, or consequential damages arising from your use of the App. Our total liability is limited to the amount you paid us in the twelve months before the claim (if any).</p>

          <h2>7. Changes</h2>
          <p>We may update these Terms from time to time. We will post the updated Terms at this URL and update the "Last updated" date. Continued use of the App after changes constitutes acceptance.</p>

          <h2>8. Contact</h2>
          <p>For questions about these Terms, contact us via the support or contact option provided in the App or at pulseflow.site.</p>
        </div>
      </main>
    </div>
  );
}
