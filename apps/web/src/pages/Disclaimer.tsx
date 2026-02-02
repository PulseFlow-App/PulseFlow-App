import { Link } from 'react-router-dom';
import styles from './LegalPage.module.css';

export function Disclaimer() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← Back</Link>
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>Disclaimer</h1>
        <p className={styles.updated}>Last updated: 2026-02-02</p>
        <div className={styles.content}>
          <h2>General</h2>
          <p>Pulse is a <strong>wellness and routine app</strong> for tracking body signals (e.g. sleep, energy, mood), daily check-ins, and viewing insights. It is intended for <strong>informational and educational use only</strong>.</p>

          <h2>Not Medical Advice</h2>
          <ul>
            <li><strong>Pulse is not a medical device</strong> and does not provide medical advice, diagnosis, or treatment.</li>
            <li>Any scores, insights, or suggestions in the App are <strong>not</strong> a substitute for professional medical, nutritional, or fitness advice.</li>
            <li><strong>Always consult a qualified healthcare provider</strong> before making decisions about your health, diet, exercise, or lifestyle.</li>
          </ul>

          <h2>No Guarantee of Accuracy</h2>
          <p>Data and insights are based on the information you provide and our current models. We do not guarantee their accuracy, completeness, or suitability for any particular purpose. You use the App and any outputs <strong>at your own risk</strong>.</p>

          <h2>Wellness and Fitness</h2>
          <p>Content related to nutrition, movement, recovery, or similar topics is for <strong>general wellness and education</strong> only. If you have health conditions or concerns, seek advice from a qualified professional before relying on the App.</p>

          <h2>Contact</h2>
          <p>For questions about this disclaimer, contact us via the App or pulseflow.site.</p>
        </div>
      </main>
    </div>
  );
}
