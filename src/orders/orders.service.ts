import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WAREHOUSE_STOCK_COLUMN, Warehouse } from 'src/common/enums/warehouse.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { Product } from 'src/products/entities/product.entity';
import { CustomersService } from 'src/customers/customers.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderItemDto } from './dto/order-item.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly customersService: CustomersService,
  ) {}

  private computeTotals(items: OrderItemDto[]): { totalAmount: number; profit: number } {
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const profit = items.reduce((sum, item) => sum + (item.price - item.originalPrice) * item.quantity, 0);
    return { totalAmount, profit };
  }

  private async decrementStock(manager: EntityManager, items: OrderItemDto[], warehouse: Warehouse): Promise<void> {
    const stockColumn = WAREHOUSE_STOCK_COLUMN[warehouse];
    const productRepo = manager.getRepository(Product);

    for (const item of items) {
      if (!item.productId) continue;
      const product = await productRepo.findOne({ where: { id: item.productId } });
      if (!product) continue;

      if (product[stockColumn] < item.quantity) {
        throw new BadRequestException(`Tồn kho ${warehouse} không đủ cho sản phẩm "${item.productName}"`);
      }
      product[stockColumn] -= item.quantity;
      await productRepo.save(product);
    }
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    return this.ordersRepository.manager.transaction(async (manager) => {
      const { totalAmount, profit } = this.computeTotals(dto.items);

      const customer = await this.customersService.upsertForOrder(manager, {
        name: dto.customerName,
        phone: dto.phone,
        address: dto.address,
      });

      await this.decrementStock(manager, dto.items, dto.warehouse);

      const orderRepo = manager.getRepository(Order);
      const order = orderRepo.create({
        customerId: customer.id,
        customerName: dto.customerName,
        phone: dto.phone,
        address: dto.address ?? '',
        status: dto.status ?? OrderStatus.UNPAID,
        warehouse: dto.warehouse,
        totalAmount,
        profit,
        items: dto.items.map((item) =>
          manager.getRepository(OrderItem).create({
            productId: item.productId ?? null,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice,
          }),
        ),
      });

      const saved = await orderRepo.save(order);
      return orderRepo.findOneOrFail({ where: { id: saved.id }, relations: ['items'] });
    });
  }

  findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({ where: { id }, relations: ['items'] });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    return this.ordersRepository.manager.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.findOne({ where: { id }, relations: ['items'] });
      if (!order) throw new NotFoundException('Order not found');

      if (dto.customerName !== undefined) order.customerName = dto.customerName;
      if (dto.phone !== undefined) order.phone = dto.phone;
      if (dto.address !== undefined) order.address = dto.address;
      if (dto.status !== undefined) order.status = dto.status;
      if (dto.warehouse !== undefined) order.warehouse = dto.warehouse;

      if (dto.items) {
        await manager.getRepository(OrderItem).delete({ orderId: id });
        const { totalAmount, profit } = this.computeTotals(dto.items);
        order.totalAmount = totalAmount;
        order.profit = profit;
        order.items = dto.items.map((item) =>
          manager.getRepository(OrderItem).create({
            productId: item.productId ?? null,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice,
          }),
        );
      }

      await orderRepo.save(order);
      return orderRepo.findOneOrFail({ where: { id }, relations: ['items'] });
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.ordersRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Order not found');
  }
}
