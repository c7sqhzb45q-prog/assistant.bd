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
          <div className="p-6 border rounded-lg">
            <h2 className="font-bold mb-2">🧱 Scaffolded modules</h2>
            <p className="text-sm text-gray-600">
              Inbox, Builder, Workflow Canvas, Auth, CRM, Messaging, Billing service, and others are roadmap placeholders.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg">📚 Current status docs</h3>
          <ul className="space-y-2 text-left max-w-md mx-auto">
            <li>📖 <a href="https://github.com/c7sqhzb45q-prog/assistant.bd/blob/main/README.md" className="text-blue-600 hover:underline">Repository README (active vs scaffolded)</a></li>
            <li>🗂️ <a href="https://github.com/c7sqhzb45q-prog/assistant.bd/blob/main/INDEX.md" className="text-blue-600 hover:underline">Project navigation index</a></li>
            <li>🚀 <a href="https://github.com/c7sqhzb45q-prog/assistant.bd/blob/main/docs/QUICKSTART.md" className="text-blue-600 hover:underline">Quickstart for local development</a></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
