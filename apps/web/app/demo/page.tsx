'use client';

import { useState } from 'react';
import Link from 'next/link';

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

type ExecutionResult = {
  executionId: string;
  workflowId: string;
  success: boolean;
  output?: {
    agentType?: string;
    reason?: string;
    channel?: string;
    skipped?: boolean;
    [key: string]: unknown;
  };
  error?: string;
  duration: number;
  actionsExecuted: number;
};

type HistoryItem = {
  id: string;
  workflowId: string;
  workflowName: string;
  success: boolean;
  duration: number;
  actionsExecuted: number;
  error?: string;
  createdAt: string;
};

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
    let message = body;
    try {
      const parsed = JSON.parse(body) as { message?: string; error?: string };
      message = parsed.message ?? parsed.error ?? body;
    } catch {
      // use raw body
    }
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default function DemoPage() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(DEFAULT_API_BASE_URL);

  const [message, setMessage] = useState('I want to buy a plan');
  const [channel, setChannel] = useState<'whatsapp' | 'facebook' | 'email' | 'api'>('whatsapp');
  const [workflowName, setWorkflowName] = useState('Demo Workflow');
  const [conditionField, setConditionField] = useState('');
  const [conditionOperator, setConditionOperator] = useState('equals');
  const [conditionValue, setConditionValue] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string>('');

  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string>('');

  function saveApiBaseUrl() {
    const normalized = normalizeBaseUrl(draftApiBaseUrl);
    setApiBaseUrl(normalized);
    setDraftApiBaseUrl(normalized);
  }

  async function runWorkflow() {
    setLoading(true);
    setResult(null);
    setError('');

    const conditions =
      conditionField.trim()
        ? [
            {
              id: 'cond_1',
              field: conditionField.trim(),
              operator: conditionOperator,
              value: conditionValue,
            },
          ]
        : [];

    const body = {
      name: workflowName || 'Demo Workflow',
      enabled: true,
      triggerData: { message, channel },
      conditions,
      actions: [
        {
          id: 'action_1',
          type: 'run_agent',
          config: { message, channel },
        },
      ],
    };

    try {
      const data = await requestJson<ExecutionResult>(apiBaseUrl, '/workflows/execute', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const data = await requestJson<HistoryItem[]>(apiBaseUrl, '/workflows/history');
      setHistory(data);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : String(err));
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Back home
        </Link>
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        🧪 Workflow Demo
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Execute a workflow end-to-end: API Gateway → Workflow Engine → AI Orchestrator
      </p>

      {/* API Base URL */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>API Base URL</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={draftApiBaseUrl}
            onChange={(e) => setDraftApiBaseUrl(e.target.value)}
            style={inputStyle}
            placeholder="http://localhost:3001"
          />
          <button type="button" onClick={saveApiBaseUrl} style={buttonStyle}>
            Save
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
          Current: <code>{apiBaseUrl}</code>
        </p>
      </section>

      {/* Workflow Input */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Workflow Input</h2>

        <label style={labelStyle}>Workflow Name</label>
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          style={{ ...inputStyle, marginBottom: '1rem' }}
          placeholder="Demo Workflow"
        />

        <label style={labelStyle}>Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          style={{ ...inputStyle, marginBottom: '1rem', resize: 'vertical' }}
          placeholder="I want to buy a plan"
        />

        <label style={labelStyle}>Channel</label>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as typeof channel)}
          style={{ ...inputStyle, marginBottom: '1.5rem' }}
        >
          <option value="whatsapp">WhatsApp</option>
          <option value="facebook">Facebook</option>
          <option value="email">Email</option>
          <option value="api">API</option>
        </select>

        <details style={{ marginBottom: '1.5rem' }}>
          <summary style={{ cursor: 'pointer', color: '#555', marginBottom: '0.5rem' }}>
            Optional: Add a condition
          </summary>
          <div style={{ paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={conditionField}
              onChange={(e) => setConditionField(e.target.value)}
              style={{ ...inputStyle, flex: '1 1 120px' }}
              placeholder="field (e.g. channel)"
            />
            <select
              value={conditionOperator}
              onChange={(e) => setConditionOperator(e.target.value)}
              style={{ ...inputStyle, flex: '0 1 140px' }}
            >
              <option value="equals">equals</option>
              <option value="not_equals">not equals</option>
              <option value="contains">contains</option>
              <option value="in">in (array)</option>
              <option value="exists">exists</option>
            </select>
            <input
              type="text"
              value={conditionValue}
              onChange={(e) => setConditionValue(e.target.value)}
              style={{ ...inputStyle, flex: '1 1 120px' }}
              placeholder="value (e.g. whatsapp)"
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
            Leave field empty to skip conditions. Field path uses dot notation (e.g. &quot;channel&quot;).
          </p>
        </details>

        <button
          type="button"
          onClick={() => void runWorkflow()}
          disabled={loading}
          style={{ ...buttonStyle, background: '#2563eb', color: '#fff', padding: '0.6rem 1.5rem', fontSize: '1rem' }}
        >
          {loading ? '⏳ Running...' : '▶ Run Workflow'}
        </button>
      </section>

      {/* Execution Result */}
      {(result !== null || error) && (
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Execution Result</h2>
          {error && (
            <div style={{ ...noticeStyle, background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>
              ❌ Error: {error}
            </div>
          )}
          {result && (
            <div>
              <div style={{ ...noticeStyle, background: result.success ? '#f0fdf4' : '#fef2f2', borderColor: result.success ? '#86efac' : '#fca5a5', color: result.success ? '#166534' : '#b91c1c' }}>
                {result.success ? '✅ Success' : '❌ Failed'}
              </div>
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <td style={tdKeyStyle}>Execution ID</td>
                    <td style={tdStyle}><code>{result.executionId}</code></td>
                  </tr>
                  <tr>
                    <td style={tdKeyStyle}>Workflow ID</td>
                    <td style={tdStyle}><code>{result.workflowId}</code></td>
                  </tr>
                  <tr>
                    <td style={tdKeyStyle}>Duration</td>
                    <td style={tdStyle}>{result.duration} ms</td>
                  </tr>
                  <tr>
                    <td style={tdKeyStyle}>Actions Executed</td>
                    <td style={tdStyle}>{result.actionsExecuted}</td>
                  </tr>
                  {result.output?.agentType && (
                    <tr>
                      <td style={tdKeyStyle}>Selected Agent</td>
                      <td style={tdStyle}><strong>{result.output.agentType}</strong></td>
                    </tr>
                  )}
                  {result.output?.reason && (
                    <tr>
                      <td style={tdKeyStyle}>Routing Reason</td>
                      <td style={tdStyle}>{result.output.reason}</td>
                    </tr>
                  )}
                  {result.output?.skipped && (
                    <tr>
                      <td style={tdKeyStyle}>Skipped</td>
                      <td style={tdStyle}>Conditions not met</td>
                    </tr>
                  )}
                  {result.error && (
                    <tr>
                      <td style={tdKeyStyle}>Error</td>
                      <td style={{ ...tdStyle, color: '#b91c1c' }}>{result.error}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {result.output && (
                <details style={{ marginTop: '0.75rem' }}>
                  <summary style={{ cursor: 'pointer', color: '#555', fontSize: '0.875rem' }}>Raw output JSON</summary>
                  <pre style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', overflow: 'auto', marginTop: '0.5rem' }}>
                    {JSON.stringify(result.output, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </section>
      )}

      {/* Execution History */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Execution History</h2>
          <button
            type="button"
            onClick={() => void loadHistory()}
            disabled={historyLoading}
            style={buttonStyle}
          >
            {historyLoading ? 'Loading...' : 'Load History'}
          </button>
        </div>

        {historyError && (
          <div style={{ ...noticeStyle, background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>
            ❌ {historyError}
          </div>
        )}

        {history !== null && history.length === 0 && (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No executions yet.</p>
        )}

        {history !== null && history.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ ...tableStyle, width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Workflow</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Duration</th>
                  <th style={thStyle}>Actions</th>
                  <th style={thStyle}>Created</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}><code style={{ fontSize: '0.75rem' }}>{item.id}</code></td>
                    <td style={tdStyle}>{item.workflowName}</td>
                    <td style={tdStyle}>{item.success ? '✅' : '❌'}</td>
                    <td style={tdStyle}>{item.duration} ms</td>
                    <td style={tdStyle}>{item.actionsExecuted}</td>
                    <td style={tdStyle}>{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const sectionStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '0.5rem',
  padding: '1.25rem',
  marginBottom: '1.5rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  marginBottom: '1rem',
  color: '#1e293b',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: '0.25rem',
  color: '#374151',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #cbd5e1',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.4rem 1rem',
  border: '1px solid #cbd5e1',
  borderRadius: '0.375rem',
  background: '#f8fafc',
  cursor: 'pointer',
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
};

const noticeStyle: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid',
  marginBottom: '0.75rem',
  fontSize: '0.875rem',
};

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
};

const tdKeyStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  fontWeight: 500,
  fontSize: '0.8rem',
  color: '#64748b',
  whiteSpace: 'nowrap',
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
};

const tdStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  fontSize: '0.875rem',
  border: '1px solid #e2e8f0',
};

const thStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  textAlign: 'left',
  border: '1px solid #e2e8f0',
  color: '#374151',
};
