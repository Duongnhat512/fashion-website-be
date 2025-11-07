import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import User from '../models/user.model';
import { UpdateUserRequestDto } from '../dtos/request/user/user.request.dto';

export default class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findByEmailWithPassword(email: string) {
    return this.repo.findOne({
      where: { email },
      select: [
        'id',
        'fullname',
        'email',
        'password',
        'dob',
        'gender',
        'phone',
        'avt',
        'role',
        'refreshToken',
      ],
    });
  }

  create(data: Partial<User>) {
    return this.repo.create(data);
  }

  save(user: User) {
    return this.repo.save(user);
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  updateRefreshToken(id: string, refreshToken: string) {
    return this.repo.update(id, { refreshToken });
  }

  getAllUsers() {
    return this.repo.find();
  }

  updateUser(updateUserDto: UpdateUserRequestDto) {
    return this.repo.update(updateUserDto.id, updateUserDto);
  }

  deleteUser(id: string) {
    return this.repo.delete(id);
  }

  updatePassword(id: string, password: string) {
    return this.repo.update(id, { password });
  }
}
