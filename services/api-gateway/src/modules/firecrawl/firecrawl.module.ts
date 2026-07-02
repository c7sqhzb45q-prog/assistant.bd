import { Module } from '@nestjs/common';
import { FirecrawlController } from './firecrawl.controller';
import { FirecrawlService } from './firecrawl.service';

@Module({
  controllers: [FirecrawlController],
  providers: [FirecrawlService],
})
export class FirecrawlModule {}
