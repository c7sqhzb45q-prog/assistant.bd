export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">🎉 assistant.bd</h1>
        <p className="text-xl text-gray-600 mb-8">AI Operating System Ready!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 border rounded-lg">
            <h2 className="font-bold mb-2">✅ API Gateway</h2>
            <p className="text-sm text-gray-600">Running on :3001</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="font-bold mb-2">⚙️ Workflow Engine</h2>
            <p className="text-sm text-gray-600">Automation core</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="font-bold mb-2">🤖 AI Orchestrator</h2>
            <p className="text-sm text-gray-600">Agent routing</p>
          </div>
          <a href="/billing" className="p-6 border rounded-lg block">
            <h2 className="font-bold mb-2">💳 Billing</h2>
            <p className="text-sm text-gray-600">Stripe Checkout + subscriptions</p>
          </a>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg">📚 Documentation</h3>
          <ul className="space-y-2 text-left max-w-md mx-auto">
            <li>📖 <a href="https://github.com" className="text-blue-600 hover:underline">Architecture Guide</a></li>
            <li>🚀 <a href="https://github.com" className="text-blue-600 hover:underline">Quick Start</a></li>
            <li>🤖 <a href="https://github.com" className="text-blue-600 hover:underline">Building Agents</a></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
