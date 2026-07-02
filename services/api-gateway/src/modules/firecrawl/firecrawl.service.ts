import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Firecrawl, type Document, type ScrapeOptions } from 'firecrawl';
import { FirecrawlScrapeDto } from './firecrawl.dto';

@Injectable()
export class FirecrawlService {
  private readonly client: Firecrawl | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('FIRECRAWL_API_KEY');
    this.client = apiKey ? new Firecrawl({ apiKey }) : null;
  }

  async scrape(dto: FirecrawlScrapeDto) {
    const client = this.requireClient();

    try {
      const document = await client.scrape(dto.url, this.toScrapeOptions(dto));

      return {
        success: true,
        data: this.toResponseData(document),
      };
    } catch (error) {
      this.rethrowAsHttpError(error);
    }
  }

  private requireClient() {
    if (!this.client) {
      throw new InternalServerErrorException(
        'FIRECRAWL_API_KEY is not configured.',
      );
    }

    return this.client;
  }

  private toScrapeOptions(dto: FirecrawlScrapeDto): ScrapeOptions | undefined {
    const options: ScrapeOptions = {
      formats: dto.formats,
      onlyMainContent: dto.onlyMainContent,
      waitFor: dto.waitFor,
      timeout: dto.timeout,
    };

    return Object.values(options).some((value) => value !== undefined)
      ? options
      : undefined;
  }

  private toResponseData(document: Document) {
    return {
      markdown: document.markdown,
      html: document.html,
      rawHtml: document.rawHtml,
      links: document.links,
      screenshot: document.screenshot,
      metadata: document.metadata,
      warning: document.warning,
    };
  }

  private rethrowAsHttpError(error: unknown): never {
    if (
      error instanceof BadRequestException ||
      error instanceof InternalServerErrorException
    ) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('URL cannot be empty')) {
      throw new BadRequestException(
        'url must be a non-empty http or https URL',
      );
    }

    throw new BadGatewayException(`Firecrawl scrape failed: ${message}`);
  }
}
