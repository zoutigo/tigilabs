import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize, sep } from "node:path";
import { StorageAdapter } from "./storage.interface";

@Injectable()
export class LocalDiskStorage implements StorageAdapter {
  private readonly root: string;

  constructor(private readonly configService: ConfigService) {
    this.root =
      this.configService.get<string>("CALENDAR_ATTACHMENTS_DIR") ??
      join(process.cwd(), "storage", "calendar-attachments");
  }

  async save(key: string, buffer: Buffer) {
    const path = this.resolve(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buffer);
  }

  read(key: string) {
    return readFile(this.resolve(key));
  }

  async delete(key: string) {
    await rm(this.resolve(key), { force: true });
  }

  private resolve(key: string) {
    const path = normalize(join(this.root, key));
    if (
      !path.startsWith(normalize(this.root) + sep) &&
      path !== normalize(this.root)
    ) {
      throw new Error("Invalid storage key");
    }
    return path;
  }
}
