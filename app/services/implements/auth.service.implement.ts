import { LoginRequestDto } from '../../dtos/request/user/user.request.dto';
import {
  AuthResponseDto,
  TokenPayloadDto,
} from '../../dtos/response/auth/auth.response.dto';
import { LoginUserResponseDto } from '../../dtos/response/user/user.response.dto';
import UserRepository from '../../repositories/user.repository';
import { IAuthService } from '../auth.service.interface';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';

export class AuthService implements IAuthService {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  generateVerificationToken(email: string): string {
    const payload = {
      email,
      type: 'email_verification',
      iat: Math.floor(Date.now() / 1000),
    };
    return jwt.sign(payload, config.secretToken!, { expiresIn: '10m' });
  }

  validateVerificationToken(token: string): { email: string } | null {
    try {
      const decoded = jwt.verify(token, config.secretToken!) as any;
      if (decoded.type === 'email_verification') {
        return { email: decoded.email };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async login(loginDto: LoginRequestDto): Promise<LoginUserResponseDto> {
    const user = await this.userRepository.findByEmailWithPassword(
      loginDto.email,
    );
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const tokenPayload: TokenPayloadDto = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    };
  }

  generateAccessToken(payload: TokenPayloadDto): string {
    return jwt.sign(payload, config.secretToken!, {
      expiresIn: config.jwtAccessTokenExpiresIn,
    });
  }

  generateRefreshToken(payload: TokenPayloadDto): string {
    return jwt.sign(payload, config.secretToken!, {
      expiresIn: config.jwtRefreshTokenExpiresIn,
    });
  }

  verifyToken(token: string, secret: string): TokenPayloadDto {
    try {
      const decoded = jwt.verify(token, secret) as TokenPayloadDto;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token đã hết hạn');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token không hợp lệ');
      }
      throw new Error('Lỗi xác thực token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.verifyToken(refreshToken, config.secretToken!);

      const user = await this.userRepository.findById(payload.userId);
      if (!user || user.refreshToken !== refreshToken) {
        throw new Error('Refresh token không hợp lệ');
      }

      const tokenPayload: TokenPayloadDto = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.generateAccessToken(tokenPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: refreshToken,
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      throw new Error('Không thể refresh token: ' + (error as Error).message);
    }
  }

  verifyAccessToken(token: string): TokenPayloadDto {
    return this.verifyToken(token, config.secretToken!);
  }

  verifyRefreshToken(token: string): TokenPayloadDto {
    return this.verifyToken(token, config.secretToken!);
  }
}
