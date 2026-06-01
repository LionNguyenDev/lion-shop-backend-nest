import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersDTO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}

  create(createUserDto: UsersDTO): Promise<User> {
    const user = new User();

    user.name = createUserDto.name;
    user.email = createUserDto.email;
    user.password = createUserDto.password;

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'name', 'email', 'isActive', 'roles'],
    });
  }

  findOne(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepository.delete(id);
  }

  async findOrCreateByGoogle(profile: { googleId: string; email: string; name: string; avatarUrl?: string | null }): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { googleId: profile.googleId } });
    if (user) return user;

    user = await this.usersRepository.findOne({ where: { email: profile.email } });
    if (user) {
      user.googleId = profile.googleId;
      user.avatarUrl = profile.avatarUrl ?? user.avatarUrl;
      return this.usersRepository.save(user);
    }

    const newUser = this.usersRepository.create({
      email: profile.email,
      name: profile.name,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl ?? null,
      password: null,
    });
    return this.usersRepository.save(newUser);
  }
}
