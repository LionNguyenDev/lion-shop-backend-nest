import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

export interface ProductResponse extends Product {
  stock: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  private toResponse(product: Product): ProductResponse {
    return { ...product, stock: product.stockHN + product.stockQB + product.stockSG };
  }

  async findAll(query: QueryProductDto) {
    const { search, brand, page, limit } = query;
    const qb = this.productsRepository.createQueryBuilder('product');

    if (search) {
      qb.andWhere('product.name ILIKE :search', { search: `%${search}%` });
    }
    if (brand) {
      qb.andWhere('LOWER(product.brand) = LOWER(:brand)', { brand });
    }

    qb.orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<ProductResponse> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.toResponse(product);
  }

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    const product = this.productsRepository.create(dto);
    const saved = await this.productsRepository.save(product);
    return this.toResponse(saved);
  }

  async update(id: number, dto: UpdateProductDto): Promise<ProductResponse> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    Object.assign(product, dto);
    const saved = await this.productsRepository.save(product);
    return this.toResponse(saved);
  }

  async remove(id: number): Promise<void> {
    const result = await this.productsRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Product not found');
  }
}
