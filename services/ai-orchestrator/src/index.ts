type AgentType = 'support' | 'sales' | 'voice' | 'booking' | 'custom';

export interface OrchestrationRequest {
  channel: 'whatsapp' | 'facebook' | 'email' | 'api';
  text: string;
}

export interface OrchestrationDecision {
  agentType: AgentType;
  reason: string;
}

export function decideAgent(request: OrchestrationRequest): OrchestrationDecision {
  const lower = request.text.toLowerCase();

  if (lower.includes('buy') || lower.includes('price') || lower.includes('plan')) {
    return { agentType: 'sales', reason: 'pricing_or_purchase_intent' };
  }

  if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule')) {
    return { agentType: 'booking', reason: 'scheduling_intent' };
  }

  return { agentType: 'support', reason: 'default_support_route' };
}

async function main() {
  console.log('🤖 AI Orchestrator starting...');
  console.log('✅ AI Orchestrator ready');
}

main().catch((error) => {
  console.error('❌ Failed to start:', error);
  process.exit(1);
});
