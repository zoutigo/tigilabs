import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../events/events.service";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

type AuthenticatedRequest = { user: AuthenticatedUser };

@UseGuards(JwtAuthGuard)
@Controller("calendar/categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.categoriesService.findVisible(request.user);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto, @Req() request: AuthenticatedRequest) {
    return this.categoriesService.create(dto, request.user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.categoriesService.update(id, dto, request.user);
  }

  @Delete(":id")
  delete(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.categoriesService.delete(id, request.user);
  }
}
