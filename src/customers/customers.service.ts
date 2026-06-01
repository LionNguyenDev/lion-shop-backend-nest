import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  async findAll(query: QueryCustomerDto) {
    const { phone, name, search, page, pageSize } = query;
    const qb = this.customersRepository.createQueryBuilder('customer');

    if (phone) {
      qb.andWhere('customer.phone = :phone', { phone });
    }
    if (name) {
      qb.andWhere('customer.name ILIKE :name', { name: `%${name}%` });
    }
    if (search) {
      qb.andWhere('(customer.name ILIKE :search OR customer.phone ILIKE :search)', { search: `%${search}%` });
    }

    qb.orderBy('customer.updatedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return { data: items, total, page, pageSize };
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customersRepository.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    if (dto.phone && dto.phone !== customer.phone) {
      const existing = await this.customersRepository.findOne({ where: { phone: dto.phone } });
      if (existing) throw new ConflictException('Phone number already in use');
    }

    Object.assign(customer, dto);
    return this.customersRepository.save(customer);
  }

  /**
   * Upsert khách hàng theo số điện thoại khi tạo đơn, tăng orderCount thêm 1.
   * Chạy trong cùng transaction với việc tạo order (nhận EntityManager).
   */
  async upsertForOrder(manager: EntityManager, data: { name: string; phone: string; address?: string }): Promise<Customer> {
    const repo = manager.getRepository(Customer);
    const existing = await repo.findOne({ where: { phone: data.phone } });

    if (existing) {
      existing.name = data.name || existing.name;
      if (data.address) existing.address = data.address;
      existing.orderCount += 1;
      return repo.save(existing);
    }

    const created = repo.create({
      name: data.name,
      phone: data.phone,
      address: data.address ?? null,
      orderCount: 1,
    });
    return repo.save(created);
  }
}
