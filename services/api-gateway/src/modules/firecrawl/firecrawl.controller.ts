import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FirecrawlScrapeDto } from './firecrawl.dto';
import { FirecrawlService } from './firecrawl.service';

@ApiTags('tools')
@Controller('tools/firecrawl')
export class FirecrawlController {
  constructor(private readonly firecrawl: FirecrawlService) {}

  @Post('scrape')
  @ApiOkResponse({ description: 'Scrapes a single URL via Firecrawl.' })
  @ApiBadGatewayResponse({
    description: 'Firecrawl returned an upstream error while scraping.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Firecrawl is not configured on the API gateway.',
  })
  scrape(@Body() dto: FirecrawlScrapeDto) {
    return this.firecrawl.scrape(dto);
  }
}
