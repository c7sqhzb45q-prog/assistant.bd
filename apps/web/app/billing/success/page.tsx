import Link from 'next/link';
import styles from '../billing.module.css';

type SuccessPageProps = {
  searchParams?: {
    session_id?: string | string[];
  };
};

function readSessionId(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default function BillingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const sessionId = readSessionId(searchParams?.session_id);

  return (
    <main className={styles.root}>
      <div className={styles.frame}>
        <section className={styles.panel}>
          <div className={styles.section}>
            <span className={styles.eyebrow}>assistant.bd billing</span>
            <h1 className={styles.title}>Checkout complete</h1>
            <p className={styles.lede}>
              Stripe returned to your app successfully. The webhook handler is
              ready to receive the subscription event.
            </p>
          </div>

          <div className={styles.section}>
            <div className={styles.stack}>
              <div className={styles.kv}>
                <span className={styles.key}>Checkout session</span>
                <span className={styles.value}>
                  {sessionId ?? 'No session id was provided.'}
                </span>
              </div>
              <div className={styles.buttonRow}>
                <Link className={styles.button} href="/billing">
                  Back to billing
                </Link>
                <Link className={`${styles.button} ${styles.buttonPrimary}`} href="/">
                  Back home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
