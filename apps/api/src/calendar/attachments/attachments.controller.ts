import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../events/events.service";
import { AttachmentsService } from "./attachments.service";

type AuthenticatedRequest = { user: AuthenticatedUser };

@UseGuards(JwtAuthGuard)
@Controller("calendar/events/:eventId/attachments")
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @Param("eventId") eventId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.attachmentsService.upload(eventId, file, request.user);
  }

  @Get(":attachmentId")
  async download(
    @Param("attachmentId") attachmentId: string,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    const { buffer, fileName, mimeType } =
      await this.attachmentsService.download(attachmentId, request.user);

    response.setHeader("Content-Type", mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    response.send(buffer);
  }

  @Delete(":attachmentId")
  remove(
    @Param("attachmentId") attachmentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.attachmentsService.remove(attachmentId, request.user);
  }
}
