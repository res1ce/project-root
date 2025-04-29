import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecret',
    });
  }

  async validate(payload: any) {
    // Ensure role is lowercase for frontend compatibility
    const role = typeof payload.role === 'string' ? payload.role.toLowerCase() : payload.role;
    
    return { 
      userId: payload.sub,
      username: payload.username, 
      role, 
      fireStationId: payload.fireStationId 
    };
  }
} 