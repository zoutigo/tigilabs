import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findVisible(userId: string) {
    return this.prisma.calendarCategory.findMany({
      where: { OR: [{ isGlobal: true }, { ownerId: userId }] },
      orderBy: [{ isGlobal: "desc" }, { name: "asc" }],
    });
  }

  findOne(id: string) {
    return this.prisma.calendarCategory.findUnique({ where: { id } });
  }

  create(dto: CreateCategoryDto, userId: string, isGlobal: boolean) {
    return this.prisma.calendarCategory.create({
      data: {
        name: dto.name,
        color: dto.color,
        isGlobal,
        ownerId: isGlobal ? null : userId,
      },
    });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.calendarCategory.update({ where: { id }, data: dto });
  }

  delete(id: string) {
    return this.prisma.calendarCategory.delete({ where: { id } });
  }
}
