import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  salt: string;
}

@Injectable()
export class AuthService {
  private readonly users = new Map<string, AuthUser>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  register(email: string, fullName: string, password: string) {
    const normalizedEmail = email.toLowerCase();
    if (this.users.has(normalizedEmail)) {
      throw new ConflictException('User already exists');
    }

    const salt = randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const user: AuthUser = {
      id: randomUUID(),
      email: normalizedEmail,
      fullName,
      passwordHash,
      salt,
    };
    this.users.set(normalizedEmail, user);

    return {
      id: user.id,
      token: this.signToken(user.id, normalizedEmail),
      tokenType: 'Bearer',
    };
  }

  login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();
    const user = this.users.get(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const inputHash = this.hashPassword(password, user.salt);
    const inputHashBuffer = Buffer.from(inputHash, 'hex');
    const storedHashBuffer = Buffer.from(user.passwordHash, 'hex');
    if (
      inputHashBuffer.length !== storedHashBuffer.length ||
      !timingSafeEqual(inputHashBuffer, storedHashBuffer)
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.signToken(user.id, normalizedEmail),
      tokenType: 'Bearer',
    };
  }

  private hashPassword(password: string, salt: string) {
    return scryptSync(password, salt, 64).toString('hex');
  }

  private signToken(userId: string, email: string) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT secret is not configured');
    }
    return this.jwtService.sign({ sub: userId, email }, { secret });
  }
}
