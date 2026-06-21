import { IsEmail, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

export const BILLING_PLAN_KEYS = ['starter', 'pro', 'business'] as const;

export type BillingPlanKey = (typeof BILLING_PLAN_KEYS)[number];

export class CreateCheckoutSessionDto {
  @IsIn(BILLING_PLAN_KEYS)
  plan!: BillingPlanKey;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  successUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  cancelUrl?: string;
}

export class CreateBillingPortalSessionDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  returnUrl?: string;
}
