import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findAll() {
    return this.usersRepository.findAll();
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  create(dto: CreateUserDto) {
    return this.usersRepository.create(dto);
  }

  update(id: string, dto: UpdateUserDto) {
    return this.usersRepository.update(id, dto);
  }
}
