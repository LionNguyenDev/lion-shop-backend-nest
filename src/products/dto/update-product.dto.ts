import { CreateProductDto } from './create-product.dto';

// PUT /products/:id — cập nhật toàn bộ, dùng lại đầy đủ field bắt buộc của CreateProductDto
export class UpdateProductDto extends CreateProductDto {}
