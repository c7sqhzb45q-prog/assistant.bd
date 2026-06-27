import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  register(email: string, fullName: string) {
    return {
      id: this.buildId(email),
      email,
      fullName,
      token: this.buildToken(email),
    };
  }

  login(email: string) {
    return {
      token: this.buildToken(email),
      tokenType: 'Bearer',
    };
  }

  private buildId(email: string) {
    return `user_${Buffer.from(email).toString('hex').slice(0, 12)}`;
  }

  private buildToken(email: string) {
    const payload = `${email}:${Date.now()}`;
    return Buffer.from(payload).toString('base64url');
  }
}
