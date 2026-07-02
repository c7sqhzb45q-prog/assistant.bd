import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsUrl,
  Min,
} from 'class-validator';

export const FIRECRAWL_SCRAPE_FORMATS = [
  'markdown',
  'html',
  'rawHtml',
  'links',
  'screenshot',
] as const;

export type FirecrawlScrapeFormat = (typeof FIRECRAWL_SCRAPE_FORMATS)[number];

export class FirecrawlScrapeDto {
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_tld: false,
    },
    { message: 'url must be a valid http or https URL' },
  )
  url!: string;

  @IsOptional()
  @IsArray()
  @IsIn(FIRECRAWL_SCRAPE_FORMATS, { each: true })
  formats?: FirecrawlScrapeFormat[];

  @IsOptional()
  @IsBoolean()
  onlyMainContent?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  waitFor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeout?: number;
}
