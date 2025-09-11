import { LoginRequestDto } from '../dtos/request/user/user.request.dto';
import { TokenPayloadDto } from '../dtos/response/auth/auth.response.dto';

import { AuthResponseDto } from '../dtos/response/auth/auth.response.dto';
import { LoginUserResponseDto } from '../dtos/response/user /user.response.dto';

export interface IAuthService {
  generateRefreshToken(tokenPayload: TokenPayloadDto): string;
  login(loginDto: LoginRequestDto): Promise<LoginUserResponseDto>;
  generateAccessToken(payload: TokenPayloadDto): string;
  refreshAccessToken(refreshToken: string): Promise<AuthResponseDto>;
  generateVerificationToken(email: string): string;
  validateVerificationToken(token: string): { email: string } | null;
}
