import {
  CreateUserRequestDto,
  LoginRequestDto,
} from '../dtos/request/user/user.request.dto';
import {
  AuthResponseDto,
  TokenPayloadDto,
} from '../dtos/response/auth/auth.response.dto';
import {
  GetUserResponseDto,
  LoginUserResponseDto,
} from '../dtos/response/user /user.response.dto';
import User from '../models/user.model';

export interface IUserService {
  createUser(createUserDto: CreateUserRequestDto): Promise<User>;
  getUserById(id: string): Promise<GetUserResponseDto>;
}
