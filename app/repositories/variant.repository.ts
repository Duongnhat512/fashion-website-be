import { Repository } from 'typeorm';
import { Variant } from '../models/variant.model';
import { AppDataSource } from '../config/data-source';

export class VariantRepository {
  private readonly variantRepository: Repository<Variant>;
  constructor() {
    this.variantRepository = AppDataSource.getRepository(Variant);
  }

  async findAll(): Promise<Variant[]> {
    return this.variantRepository.find();
  }

  async findById(id: string): Promise<Variant | null> {
    return this.variantRepository.findOne({ where: { id } });
  }

  async create(variant: Variant): Promise<Variant> {
    return this.variantRepository.save(variant);
  }

  async update(id: string, variant: Variant): Promise<Variant> {
    return this.variantRepository.save({ ...variant, id });
  }
}
