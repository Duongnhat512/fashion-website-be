import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
} from '../../dtos/request/user/user.request.dto';
import {
  GetUserResponseDto,
  UpdateUserResponseDto,
} from '../../dtos/response/user/user.response.dto';
import User from '../../models/user.model';

export interface IUserService {
  createUser(createUserDto: CreateUserRequestDto): Promise<User>;
  getUserById(id: string): Promise<GetUserResponseDto>;
  getAllUsers(): Promise<User[]>;
  updateUser(
    updateUserDto: UpdateUserRequestDto,
  ): Promise<UpdateUserResponseDto>;
  deleteUser(id: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
  verifyResetOtpAndGetToken(email: string, otp: number): Promise<string>;
}
