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

export class UserService implements IUserService {
  private readonly userRepository: UserRepository;
  private readonly authService: IAuthService;
  constructor() {
    this.userRepository = new UserRepository();
    this.authService = new AuthService();
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
      id: user.generatedMaps[0].id,
      fullname: user.generatedMaps[0].fullname,
      email: user.generatedMaps[0].email,
      role: user.generatedMaps[0].role,
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
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
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

    return savedUser;
  }
}
