import { Repository } from 'typeorm';
import { Color } from '../models/color.model';
import { AppDataSource } from '../config/data-source';

export class ColorRepository {
  private readonly colorRepository: Repository<Color>;
  constructor() {
    this.colorRepository = AppDataSource.getRepository(Color);
  }

  async findAll(): Promise<Color[]> {
    return this.colorRepository.find();
  }

  async findById(id: string): Promise<Color | null> {
    return this.colorRepository.findOne({ where: { id } });
  }

  async create(color: Color): Promise<Color> {
    return this.colorRepository.save(color);
  }

  async update(id: string, color: Color): Promise<Color> {
    return this.colorRepository.save({ ...color, id });
  }

  async delete(id: string): Promise<void> {
    await this.colorRepository.delete(id);
  }
}
