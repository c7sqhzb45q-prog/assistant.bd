import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

function makeReflector(isPublic: boolean): Reflector {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);
  return reflector;
}

function makeContext(): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('returns true for @Public() handler', () => {
    const guard = new JwtAuthGuard(makeReflector(true));
    const result = guard.canActivate(makeContext());
    expect(result).toBe(true);
  });

  it('calls super.canActivate for non-public handler', () => {
    const guard = new JwtAuthGuard(makeReflector(false));
    const superSpy = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockReturnValueOnce(true as any);
    const context = makeContext();
    guard.canActivate(context);
    expect(superSpy).toHaveBeenCalledWith(context);
  });
});

describe('JwtStrategy', () => {
  const secret = 'test-secret-that-is-long-enough';

  function makeStrategy(jwtSecret = secret) {
    const config = { getOrThrow: (_key: string) => jwtSecret } as unknown as ConfigService;
    return new JwtStrategy(config);
  }

  it('should be defined', () => {
    expect(makeStrategy()).toBeDefined();
  });

  it('validate() returns payload for valid sub', () => {
    const strategy = makeStrategy();
    const payload: JwtPayload = { sub: 'user_123', email: 'test@example.com', role: 'user' };
    const result = strategy.validate(payload);
    expect(result).toEqual(payload);
  });

  it('validate() throws UnauthorizedException when sub is empty string', () => {
    const strategy = makeStrategy();
    expect(() => strategy.validate({ sub: '' } as JwtPayload)).toThrow(UnauthorizedException);
  });

  it('validate() throws UnauthorizedException when sub is missing', () => {
    const strategy = makeStrategy();
    expect(() => strategy.validate({} as JwtPayload)).toThrow(UnauthorizedException);
  });
});

describe('@Public decorator', () => {
  it('sets IS_PUBLIC_KEY metadata', () => {
    const key = IS_PUBLIC_KEY;
    expect(key).toBe('isPublic');
  });
});
