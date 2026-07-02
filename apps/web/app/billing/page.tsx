'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './billing.module.css';

type BillingPlan = {
  key: 'starter' | 'pro' | 'business';
  name: string;
  description: string;
  features: string[];
  configured: boolean;
};

type SessionResponse = {
  id: string;
  url?: string | null;
};

const STORAGE_KEY = 'assistant.bd.apiBaseUrl';
const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default function BillingPage() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [customerEmail, setCustomerEmail] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const saved =
      window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_API_BASE_URL;
    const normalized = normalizeBaseUrl(saved);

    setApiBaseUrl(normalized);
    setDraftApiBaseUrl(normalized);
    void loadPlans(normalized);
  }, []);

  async function loadPlans(baseUrl = apiBaseUrl) {
    setLoadingPlans(true);
    setError('');
    setMessage('');

    try {
      const data = await requestJson<BillingPlan[]>(baseUrl, '/billing/plans');
      setPlans(data);
    } catch (err) {
      setPlans([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load plans from the API.',
      );
    } finally {
      setLoadingPlans(false);
    }
  }

  function saveApiBaseUrl() {
    const normalized = normalizeBaseUrl(draftApiBaseUrl);
    window.localStorage.setItem(STORAGE_KEY, normalized);
    setApiBaseUrl(normalized);
    setMessage('Saved API base URL.');
    void loadPlans(normalized);
  }

  async function startCheckout(plan: BillingPlan['key']) {
    setActivePlan(plan);
    setError('');
    setMessage('');

    try {
      const origin = window.location.origin;
      const payload = {
        plan,
        customerEmail: customerEmail.trim() || undefined,
        workspaceId: workspaceId.trim() || undefined,
        successUrl: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/billing`,
      };

      const session = await requestJson<SessionResponse>(
        apiBaseUrl,
        '/billing/checkout',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      if (!session.url) {
        throw new Error('Stripe Checkout session did not return a URL.');
      }

      window.location.assign(session.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to start checkout.',
      );
    } finally {
      setActivePlan(null);
    }
  }

  async function openBillingPortal() {
    setError('');
    setMessage('');

    try {
      const origin = window.location.origin;
      const session = await requestJson<SessionResponse>(
        apiBaseUrl,
        '/billing/portal',
        {
          method: 'POST',
          body: JSON.stringify({
            customerEmail: customerEmail.trim() || undefined,
            returnUrl: `${origin}/billing`,
          }),
        },
      );

      if (!session.url) {
        throw new Error('Stripe Portal session did not return a URL.');
      }

      window.location.assign(session.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to open the billing portal.',
      );
    }
  }

  const configuredCount = plans.filter((plan) => plan.configured).length;

  return (
    <main className={styles.root}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>assistant.bd billing</span>
            <h1 className={styles.title}>Stripe subscriptions</h1>
            <p className={styles.lede}>
              Connect your billing plans, launch Stripe Checkout, and route
              subscription webhooks back to the API Gateway.
            </p>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.field}>
              <span className={styles.label}>API Base URL</span>
              <input
                className={styles.input}
                value={draftApiBaseUrl}
                onChange={(event) => setDraftApiBaseUrl(event.target.value)}
                placeholder="https://api.example.com"
                spellCheck={false}
              />
            </div>

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={saveApiBaseUrl}
              >
                Save URL
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => void loadPlans(apiBaseUrl)}
              >
                Refresh plans
              </button>
              <Link className={styles.button} href="/">
                Back home
              </Link>
            </div>
          </div>
        </header>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Plans</h2>
                  <p className={styles.muted}>
                    {loadingPlans
                      ? 'Loading plans from the API...'
                      : `${configuredCount} of ${plans.length} plans are configured with Stripe price IDs.`}
                  </p>
                </div>
                <div className={styles.badge}>
                  {configuredCount}/{plans.length || 3} ready
                </div>
              </div>

              {error ? (
                <div className={`${styles.notice} ${styles.error}`}>{error}</div>
              ) : null}

              {!error && message ? (
                <div className={`${styles.notice} ${styles.success}`}>
                  {message}
                </div>
              ) : null}

              <div className={styles.plans}>
                {plans.map((plan) => (
                  <article key={plan.key} className={styles.plan}>
                    <div className={styles.planTop}>
                      <div>
                        <h3 className={styles.planName}>{plan.name}</h3>
                        <p className={styles.muted}>{plan.description}</p>
                      </div>
                      <span
                        className={`${styles.badge} ${
                          plan.configured
                            ? styles.badgeReady
                            : styles.badgeMissing
                        }`}
                      >
                        {plan.configured ? 'Ready' : 'Needs price ID'}
                      </span>
                    </div>

                    <ul className={styles.features}>
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        disabled={!plan.configured || activePlan !== null}
                        onClick={() => void startCheckout(plan.key)}
                      >
                        {activePlan === plan.key
                          ? 'Starting...'
                          : 'Start checkout'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Return flow</h2>
                <p className={styles.muted}>
                  Stripe sends successful subscriptions back to the web app
                  after checkout.
                </p>
              </div>
            </div>
            <div className={styles.notice}>
              Success URL: <strong>/billing/success</strong>
              <br />
              Cancel URL: <strong>/billing</strong>
            </div>
          </div>
          </div>

          <aside className={styles.panel}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Customer access</h2>
                  <p className={styles.muted}>
                    Use email-based lookup for Checkout and the Billing Portal.
                  </p>
                </div>
              </div>

              <div className={styles.stack}>
                <label className={styles.field}>
                  <span className={styles.label}>Customer email</span>
                  <input
                    className={styles.input}
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    placeholder="you@company.com"
                    type="email"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Workspace ID</span>
                  <input
                    className={styles.input}
                    value={workspaceId}
                    onChange={(event) => setWorkspaceId(event.target.value)}
                    placeholder="workspace_123"
                    spellCheck={false}
                  />
                </label>

                <div className={styles.buttonRow}>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => void openBillingPortal()}
                  >
                    Open portal
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>API status</h2>
                  <p className={styles.muted}>
                    The frontend stores your API URL in localStorage.
                  </p>
                </div>
              </div>

              <div className={styles.stack}>
                <div className={styles.kv}>
                  <span className={styles.key}>Saved URL</span>
                  <span className={styles.value}>{apiBaseUrl}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.key}>Plan endpoint</span>
                  <span className={styles.value}>GET /billing/plans</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.key}>Webhook endpoint</span>
                  <span className={styles.value}>POST /billing/webhook</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
