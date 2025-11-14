import { config } from '../../../config/env';
import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
} from '../../../dtos/request/user/user.request.dto';
import { TokenPayloadDto } from '../../../dtos/response/auth/auth.response.dto';
import {
  GetUserResponseDto,
  UpdateUserResponseDto,
} from '../../../dtos/response/user/user.response.dto';
import Role from '../../../models/enum/role.enum';
import User from '../../../models/user.model';
import UserRepository from '../../../repositories/user.repository';
import { IUserService } from '../user.service.interface';
import bcrypt from 'bcrypt';
import { AuthService } from '../../auth/implements/auth.service.implement';
import { IAuthService } from '../../auth/auth.service.interface';
import { ICartService } from '../../cart/cart.service.interface';
import CreateCartRequestDto from '../../../dtos/request/cart/cart.request';
import CartService from '../../cart/implements/cart.service.implement';
import IOtpService from '../../otp/otp.service.interface';
import { IEmailService } from '../../email/email.service.interface';
import { EmailService } from '../../email/implements/email.service.implement';
import { OtpService } from '../../otp/implements/opt.service.implement';
import jwt from 'jsonwebtoken';
import redis from '../../../config/redis.config';

export class UserService implements IUserService {
  private readonly userRepository: UserRepository;
  private readonly authService: IAuthService;
  private readonly cartService: ICartService;
  private readonly emailService: IEmailService;
  private readonly otpService: IOtpService;

  constructor() {
    this.userRepository = new UserRepository();
    this.authService = new AuthService();
    this.cartService = new CartService();
    this.emailService = new EmailService();
    this.otpService = new OtpService();
  }
  getAllUsers(): Promise<User[]> {
    return this.userRepository.getAllUsers();
  }
  async updateUser(
    updateUserDto: UpdateUserRequestDto,
  ): Promise<UpdateUserResponseDto> {
    const user = await this.userRepository.updateUser(updateUserDto);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    };
  }
  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    await this.userRepository.deleteUser(id);
  }
  async getUserById(id: string): Promise<GetUserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      ...user,
    };
  }

  async createUser(createUserDto: CreateUserRequestDto): Promise<User> {
    const userExist = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (userExist) {
      throw new Error('User already exists');
    }
    const verificationToken = this.authService.validateVerificationToken(
      createUserDto.verificationToken,
    );
    if (!verificationToken) {
      throw new Error('Token xác thực không hợp lệ hoặc đã hết hạn');
    }

    const passwordHash = await bcrypt.hash(
      createUserDto.password,
      config.saltRounds,
    );

    const userToCreate = {
      ...createUserDto,
      password: passwordHash,
      dob: createUserDto.dob ? new Date(createUserDto.dob) : undefined,
      role: createUserDto.role || Role.USER,
    };

    const user = await this.userRepository.create(userToCreate);
    const savedUser = await this.userRepository.save(user);

    const tokenPayload: TokenPayloadDto = {
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };

    const refreshToken = this.authService.generateRefreshToken(tokenPayload);

    await this.userRepository.updateRefreshToken(savedUser.id, refreshToken);

    delete (savedUser as any).password;

    await this.cartService.createCart({
      user: savedUser,
    } as CreateCartRequestDto);

    return savedUser;
  }
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User không tồn tại');
    }

    const otp = this.otpService.generateOtp();
    const resetOtpKey = `reset_otp:${email}`;

    await redis.set(resetOtpKey, otp.toString(), 'EX', 300);

    try {
      const htmlTemplate = await this.emailService.readHtmlTemplate(
        'email_template',
        {
          otp,
          username: email.split('@')[0],
        },
      );

      await this.emailService.handleSendEmail(
        email,
        'Mã OTP đặt lại mật khẩu - BooBoo',
        htmlTemplate,
      );
    } catch (error) {
      await redis.del(resetOtpKey);
      throw new Error('Không thể gửi email OTP');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    let decoded: { email: string; type: string };
    try {
      decoded = jwt.verify(token, config.secretToken!) as any;

      if (decoded.type !== 'password_reset') {
        throw new Error('Token không hợp lệ');
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error(
          'Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu lại.',
        );
      }
      throw new Error('Token không hợp lệ');
    }

    const email = decoded.email;

    const otpVerifiedKey = `reset_otp_verified:${email}`;
    const isOtpVerified = await redis.get(otpVerifiedKey);

    if (!isOtpVerified) {
      throw new Error('OTP chưa được xác thực. Vui lòng xác thực OTP trước.');
    }

    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const passwordHash = await bcrypt.hash(password, config.saltRounds);

    await this.userRepository.updatePassword(user.id, passwordHash);

    await redis.del(otpVerifiedKey);
    await redis.del(`reset_otp:${email}`);
  }

  async verifyResetOtpAndGetToken(email: string, otp: number): Promise<string> {
    const resetOtpKey = `reset_otp:${email}`;
    const storedOtp = await redis.get(resetOtpKey);

    if (!storedOtp || storedOtp !== otp.toString()) {
      throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    await redis.del(resetOtpKey);

    const otpVerifiedKey = `reset_otp_verified:${email}`;
    await redis.set(otpVerifiedKey, 'true', 'EX', 600);

    const resetToken = jwt.sign(
      {
        email: email,
        type: 'password_reset',
        iat: Math.floor(Date.now() / 1000),
      },
      config.secretToken!,
      { expiresIn: '10m' },
    );

    return resetToken;
  }
}
