import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findAll() {
    return this.usersRepository
      .findAll()
      .then((users) => users.map(this.toPublicUser));
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.toPublicUser(user);
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  create(dto: CreateUserDto) {
    return this.usersRepository.create(dto).then(this.toPublicUser);
  }

  update(id: string, dto: UpdateUserDto) {
    return this.usersRepository.update(id, dto).then(this.toPublicUser);
  }

  private toPublicUser(user: Awaited<ReturnType<UsersRepository["findOne"]>>) {
    if (!user) {
      return user;
    }

    const roles = user.roles.map((item) => item.role.name);
    const permissions = user.roles.flatMap((item) =>
      item.role.permissions.map(
        ({ permission }) => `${permission.subject}.${permission.action}`,
      ),
    );

    return {
      ...user,
      role: roles[0],
      roles,
      permissions: Array.from(new Set(permissions)),
    };
  }
}
