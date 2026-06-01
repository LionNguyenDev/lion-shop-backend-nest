import { ValueTransformer } from 'typeorm';

/**
 * TypeORM trả về cột `bigint` của PostgreSQL dưới dạng string để tránh tràn số.
 * Với giá tiền VND (đơn vị đồng) các giá trị vẫn nằm trong Number.MAX_SAFE_INTEGER,
 * nên transformer này chuyển về number khi đọc và giữ nguyên khi ghi.
 */
export class NumericTransformer implements ValueTransformer {
  to(value: number | null): number | null {
    return value;
  }

  from(value: string | null): number | null {
    return value === null ? null : parseInt(value, 10);
  }
}

export const numericTransformer = new NumericTransformer();
