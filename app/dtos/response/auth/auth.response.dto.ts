export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: string;
    fullname: string;
    email: string;
    role: string;
  };
}

export class TokenPayloadDto {
  userId!: string;
  email!: string;
  role!: string;
}
