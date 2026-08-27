import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CommentsService } from "./comments.service";

@Controller("tasks/:taskId/comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findByTask(@Param("taskId") taskId: string) {
    return this.commentsService.findByTask(taskId);
  }

  @Post()
  create(@Param("taskId") taskId: string, @Body() body: { content: string; userId: string }) {
    return this.commentsService.create(taskId, body);
  }
}
