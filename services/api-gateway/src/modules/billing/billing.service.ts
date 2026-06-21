import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  BillingPlanKey,
  CreateBillingPortalSessionDto,
  CreateCheckoutSessionDto,
} from './billing.dto';

type StripeClient = InstanceType<typeof Stripe>;

interface BillingPlan {
  key: BillingPlanKey;
  name: string;
  description: string;
  priceId?: string;
  features: string[];
}

@Injectable()
export class BillingService {
  private readonly stripe: StripeClient | null;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    this.stripe = secretKey
      ? new Stripe(secretKey, {
          apiVersion: '2026-02-25.clover' as any,
        })
      : null;
  }

  getPlans() {
    return this.plans().map(({ priceId, ...plan }) => ({
      ...plan,
      configured: Boolean(priceId),
    }));
  }

  async createCheckoutSession(dto: CreateCheckoutSessionDto) {
    const stripe = this.requireStripe();
    const plan = this.getConfiguredPlan(dto.plan);
    const customer = await this.resolveCustomer(stripe, dto);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer?.id,
      customer_email: customer ? undefined : dto.customerEmail,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url:
        dto.successUrl ??
        this.config.get<string>('STRIPE_SUCCESS_URL') ??
        `${this.frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        dto.cancelUrl ??
        this.config.get<string>('STRIPE_CANCEL_URL') ??
        `${this.frontendUrl}/billing`,
      allow_promotion_codes: true,
      metadata: {
        plan: plan.key,
        workspaceId: dto.workspaceId ?? '',
      },
      subscription_data: {
        metadata: {
          plan: plan.key,
          workspaceId: dto.workspaceId ?? '',
        },
      },
    });

    return {
      id: session.id,
      url: session.url,
    };
  }

  async createBillingPortalSession(dto: CreateBillingPortalSessionDto) {
    const stripe = this.requireStripe();
    const customer = await this.resolveCustomer(stripe, dto);

    if (!customer) {
      throw new BadRequestException(
        'Provide customerId or customerEmail to open the billing portal.',
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url:
        dto.returnUrl ??
        this.config.get<string>('STRIPE_PORTAL_RETURN_URL') ??
        `${this.frontendUrl}/billing`,
    });

    return {
      id: session.id,
      url: session.url,
    };
  }

  handleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    const stripe = this.requireStripe();
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new InternalServerErrorException(
        'STRIPE_WEBHOOK_SECRET is not configured.',
      );
    }

    if (!rawBody || !signature) {
      throw new BadRequestException('Missing Stripe webhook signature.');
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        console.log(`[Stripe] ${event.type}`, event.data.object);
        break;
      default:
        console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    return {
      received: true,
      type: event.type,
    };
  }

  private plans(): BillingPlan[] {
    return [
      {
        key: 'starter',
        name: 'Starter',
        description: 'For testing automations and simple agents.',
        priceId: this.config.get<string>('STRIPE_PRICE_STARTER'),
        features: ['1 workspace', 'Basic workflows', 'Email support'],
      },
      {
        key: 'pro',
        name: 'Pro',
        description: 'For growing teams running live customer workflows.',
        priceId: this.config.get<string>('STRIPE_PRICE_PRO'),
        features: ['5 workspaces', 'AI agents', 'Priority support'],
      },
      {
        key: 'business',
        name: 'Business',
        description: 'For high-volume automation and team operations.',
        priceId: this.config.get<string>('STRIPE_PRICE_BUSINESS'),
        features: ['Unlimited workflows', 'Advanced integrations', 'SLA support'],
      },
    ];
  }

  private getConfiguredPlan(planKey: BillingPlanKey) {
    const plan = this.plans().find((item) => item.key === planKey);

    if (!plan?.priceId) {
      throw new BadRequestException(
        `Stripe price for "${planKey}" is not configured.`,
      );
    }

    return plan;
  }

  private requireStripe() {
    if (!this.stripe) {
      throw new InternalServerErrorException(
        'STRIPE_SECRET_KEY is not configured.',
      );
    }

    return this.stripe;
  }

  private async resolveCustomer(
    stripe: StripeClient,
    dto: { customerId?: string; customerEmail?: string },
  ) {
    if (dto.customerId) {
      const customer = await stripe.customers.retrieve(dto.customerId);
      if ('deleted' in customer && customer.deleted) {
        throw new BadRequestException(
          `Stripe customer "${dto.customerId}" was deleted.`,
        );
      }
      return customer;
    }

    if (!dto.customerEmail) {
      return null;
    }

    const existing = await stripe.customers.list({
      email: dto.customerEmail,
      limit: 1,
    });

    const customer = existing.data[0] ?? (await stripe.customers.create({ email: dto.customerEmail }));
    return customer;
  }
}
