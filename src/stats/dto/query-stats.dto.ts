import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export type StatsRange = 'today' | '7d' | '30d' | '365d';

export class QueryStatsDto {
  @ApiPropertyOptional({ enum: ['today', '7d', '30d', '365d'], default: '7d' })
  @IsOptional()
  @IsIn(['today', '7d', '30d', '365d'])
  range: StatsRange = '7d';
}
