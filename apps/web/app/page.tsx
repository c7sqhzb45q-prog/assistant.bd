export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">🎉 assistant.bd</h1>
        <p className="text-xl text-gray-600 mb-8">
          MVP baseline in progress (active modules + scaffolded roadmap modules)
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 border rounded-lg">
            <h2 className="font-bold mb-2">✅ API Gateway</h2>
            <p className="text-sm text-gray-600">Active service (health/docs endpoints)</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="font-bold mb-2">✅ Workflow Engine</h2>
            <p className="text-sm text-gray-600">Active service (execution core)</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="font-bold mb-2">✅ AI Orchestrator</h2>
            <p className="text-sm text-gray-600">Active service (agent routing)</p>
          </div>
          <a href="/billing" className="p-6 border rounded-lg block">
            <h2 className="font-bold mb-2">🧪 Billing</h2>
            <p className="text-sm text-gray-600">Feature test UI (requires API + Stripe config)</p>
          </a>
          <a href="/demo" className="p-6 border rounded-lg block">
            <h2 className="font-bold mb-2">▶ Workflow Demo</h2>
            <p className="text-sm text-gray-600">End-to-end demo: message → workflow → AI orchestration</p>
          </a>
          <div className="p-6 border rounded-lg">
            <h2 className="font-bold mb-2">🧱 Scaffolded modules</h2>
            <p className="text-sm text-gray-600">
              Additional apps/services/packages are roadmap placeholders (see README.md and SETUP_SUMMARY.md for the current full list).
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg">📚 Current status docs</h3>
          <p className="text-left max-w-md mx-auto text-sm text-gray-600">
            Check repository docs for current implementation status:
            {' '}<code>README.md</code>, <code>INDEX.md</code>, and <code>docs/QUICKSTART.md</code>.
          </p>
        </div>
      </div>
    </main>
  );
}
