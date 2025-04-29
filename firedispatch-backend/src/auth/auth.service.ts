import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) throw new UnauthorizedException('User not found');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid password');
    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    
    // Convert role enum value to lowercase string for frontend compatibility
    const roleString = user.role.toLowerCase();
    
    const payload = {
      sub: user.id,
      username: user.username,
      role: roleString,
      fireStationId: user.fireStationId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: roleString,
        fireStationId: user.fireStationId
      },
    };
  }
}
