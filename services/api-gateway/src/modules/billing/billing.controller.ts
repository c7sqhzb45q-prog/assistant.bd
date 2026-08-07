import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import {
  CreateBillingPortalSessionDto,
  CreateCheckoutSessionDto,
} from './billing.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('plans')
  @Public()
  @ApiOkResponse({ description: 'Returns assistant.bd subscription plans.' })
  getPlans() {
    return this.billing.getPlans();
  }

  @Post('checkout')
  @ApiOkResponse({ description: 'Creates a Stripe Checkout Session.' })
  createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.billing.createCheckoutSession(dto);
  }

  @Post('portal')
  @ApiOkResponse({ description: 'Creates a Stripe Billing Portal Session.' })
  createBillingPortalSession(@Body() dto: CreateBillingPortalSessionDto) {
    return this.billing.createBillingPortalSession(dto);
  }

  @Post('webhook')
  @Public()
  @HttpCode(200)
  @ApiOkResponse({ description: 'Receives and verifies Stripe webhook events.' })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.billing.handleWebhook(req.rawBody, signature);
  }
}
