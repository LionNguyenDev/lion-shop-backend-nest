import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { StatsRange } from './dto/query-stats.dto';

const TIMEZONE = 'Asia/Ho_Chi_Minh';

interface RangeConfig {
  days: number;
  // Định dạng bucket theo TO_CHAR của PostgreSQL
  bucketFormat: string;
}

const RANGE_CONFIG: Record<StatsRange, RangeConfig> = {
  today: { days: 1, bucketFormat: 'HH24' },
  '7d': { days: 7, bucketFormat: 'YYYY-MM-DD' },
  '30d': { days: 30, bucketFormat: 'YYYY-MM-DD' },
  '365d': { days: 365, bucketFormat: 'YYYY-MM' },
};

export interface Bucket {
  bucket: string;
  orders: number;
  revenue: number;
  profit: number;
}

export interface PeriodSummary {
  orders: number;
  revenue: number;
  profit: number;
  buckets: Bucket[];
}

export interface StatsResponse {
  range: StatsRange;
  current: PeriodSummary;
  previous: PeriodSummary;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  async getStats(range: StatsRange): Promise<StatsResponse> {
    const { days, bucketFormat } = RANGE_CONFIG[range];
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    const currentStart = new Date(now.getTime() - days * dayMs);
    const previousStart = new Date(now.getTime() - 2 * days * dayMs);

    const [current, previous] = await Promise.all([
      this.aggregate(currentStart, now, bucketFormat),
      this.aggregate(previousStart, currentStart, bucketFormat),
    ]);

    return { range, current, previous };
  }

  private async aggregate(start: Date, end: Date, bucketFormat: string): Promise<PeriodSummary> {
    const rows: Array<{ bucket: string; orders: string; revenue: string; profit: string }> = await this.ordersRepository.query(
      `
      SELECT
        TO_CHAR("createdAt" AT TIME ZONE $3, $4)                              AS bucket,
        COUNT(*)                                                             AS orders,
        COALESCE(SUM(CASE WHEN "status" = 'Paid' THEN "totalAmount" ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN "status" = 'Paid' THEN "profit"      ELSE 0 END), 0) AS profit
      FROM orders
      WHERE "createdAt" >= $1 AND "createdAt" < $2
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      [start, end, TIMEZONE, bucketFormat],
    );

    const buckets: Bucket[] = rows.map((row) => ({
      bucket: row.bucket,
      orders: parseInt(row.orders, 10),
      revenue: parseInt(row.revenue, 10),
      profit: parseInt(row.profit, 10),
    }));

    return {
      orders: buckets.reduce((sum, b) => sum + b.orders, 0),
      revenue: buckets.reduce((sum, b) => sum + b.revenue, 0),
      profit: buckets.reduce((sum, b) => sum + b.profit, 0),
      buckets,
    };
  }
}
