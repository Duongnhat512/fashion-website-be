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
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: string;
    fullname: string;
    email: string;
    role: string;
  };
}

export class GetUserResponseDto {
  id!: string;
  fullname!: string;
  email!: string;
  role!: string;
}
