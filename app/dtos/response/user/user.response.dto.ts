import Role from '../../../models/enum/role.enum';

export class CreateUserResponseDto {
  id!: string;
  fullname!: string;
  email!: string;
  role!: string;
}

export class UpdateUserResponseDto {
  id!: string;
  fullname!: string;
  email!: string;
  role!: string;
}

export class LoginUserResponseDto {
  accessToken: string;
  refreshToken: string;
  user!: {
    id: string;
    fullname: string;
    email: string;
    role: Role;
    dob: Date;
    gender: string;
    phone: string;
    avt: string;
    refreshToken?: string;
  };
}

export class GetUserResponseDto {
  id: string;
  fullname: string;
  email: string;
  role: Role;
  dob: Date;
  gender: string;
  phone: string;
  avt: string;
  refreshToken?: string;
}
