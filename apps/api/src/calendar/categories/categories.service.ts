import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuthenticatedUser } from "../events/events.service";
import { CategoriesRepository } from "./categories.repository";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  findVisible(user: AuthenticatedUser) {
    return this.categoriesRepository.findVisible(user.id);
  }

  async create(dto: CreateCategoryDto, user: AuthenticatedUser) {
    const wantsGlobal = Boolean(dto.isGlobal);

    if (wantsGlobal && !this.canManageGlobal(user)) {
      throw new ForbiddenException(
        "Seul un administrateur peut creer une categorie globale",
      );
    }

    return this.categoriesRepository.create(dto, user.id, wantsGlobal);
  }

  async update(id: string, dto: UpdateCategoryDto, user: AuthenticatedUser) {
    const category = await this.assertCanManage(id, user);
    return this.categoriesRepository.update(category.id, dto);
  }

  async delete(id: string, user: AuthenticatedUser) {
    const category = await this.assertCanManage(id, user);
    await this.categoriesRepository.delete(category.id);
    return { ok: true };
  }

  private async assertCanManage(id: string, user: AuthenticatedUser) {
    const category = await this.categoriesRepository.findOne(id);

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    if (category.isGlobal && !this.canManageGlobal(user)) {
      throw new ForbiddenException("Access denied");
    }

    if (!category.isGlobal && category.ownerId !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    return category;
  }

  private canManageGlobal(user: AuthenticatedUser) {
    return (
      user.permissions?.includes("calendar.category.manage_global") ?? false
    );
  }
}
