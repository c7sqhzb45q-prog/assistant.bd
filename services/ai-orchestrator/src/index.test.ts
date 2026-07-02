import { decideAgent } from './index';

describe('decideAgent', () => {
  describe('sales routing', () => {
    it('routes "buy" keyword to sales agent', () => {
      const result = decideAgent({ text: 'I want to buy a plan', channel: 'api' });
      expect(result.agentType).toBe('sales');
      expect(result.reason).toBe('pricing_or_purchase_intent');
    });

    it('routes "price" keyword to sales agent', () => {
      const result = decideAgent({ text: 'What is your price?', channel: 'whatsapp' });
      expect(result.agentType).toBe('sales');
      expect(result.reason).toBe('pricing_or_purchase_intent');
    });

    it('routes "plan" keyword to sales agent', () => {
      const result = decideAgent({ text: 'Tell me about the plan options', channel: 'email' });
      expect(result.agentType).toBe('sales');
      expect(result.reason).toBe('pricing_or_purchase_intent');
    });

    it('is case-insensitive for sales keywords', () => {
      const result = decideAgent({ text: 'HOW MUCH TO BUY?', channel: 'api' });
      expect(result.agentType).toBe('sales');
    });
  });

  describe('booking routing', () => {
    it('routes "book" keyword to booking agent', () => {
      const result = decideAgent({ text: 'I want to book a meeting', channel: 'whatsapp' });
      expect(result.agentType).toBe('booking');
      expect(result.reason).toBe('scheduling_intent');
    });

    it('routes "appointment" keyword to booking agent', () => {
      const result = decideAgent({ text: 'I need an appointment', channel: 'facebook' });
      expect(result.agentType).toBe('booking');
      expect(result.reason).toBe('scheduling_intent');
    });

    it('routes "schedule" keyword to booking agent', () => {
      const result = decideAgent({ text: 'Can we schedule a call?', channel: 'api' });
      expect(result.agentType).toBe('booking');
      expect(result.reason).toBe('scheduling_intent');
    });
  });

  describe('support routing (default)', () => {
    it('routes unknown messages to support agent', () => {
      const result = decideAgent({ text: 'I have an issue with my order', channel: 'api' });
      expect(result.agentType).toBe('support');
      expect(result.reason).toBe('default_support_route');
    });

    it('routes empty-ish messages to support agent', () => {
      const result = decideAgent({ text: 'hello', channel: 'whatsapp' });
      expect(result.agentType).toBe('support');
    });

    it('routes help requests to support agent', () => {
      const result = decideAgent({ text: 'I need help with my account', channel: 'email' });
      expect(result.agentType).toBe('support');
    });
  });

  describe('channel handling', () => {
    const channels = ['whatsapp', 'facebook', 'email', 'api'] as const;

    channels.forEach((channel) => {
      it(`works correctly with channel="${channel}"`, () => {
        const result = decideAgent({ text: 'buy now', channel });
        expect(result.agentType).toBe('sales');
      });
    });
  });
});
