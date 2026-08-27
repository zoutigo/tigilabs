import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const roles = user.roles?.map((item) => item.role.name) ?? [];
    const payload = { sub: user.id, email: user.email, roles };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken: await this.jwtService.signAsync(payload, { expiresIn: "7d" }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        roles
      }
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken);
    return {
      accessToken: await this.jwtService.signAsync({
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles ?? []
      })
    };
  }
}
