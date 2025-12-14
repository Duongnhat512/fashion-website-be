import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import Address from '../models/address.model';

export class AddressRepository {
  private readonly addressRepository: Repository<Address>;

  constructor() {
    this.addressRepository = AppDataSource.getRepository(Address);
  }

  async findById(id: string): Promise<Address | null> {
    return this.addressRepository.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  async findByUserId(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(address: Partial<Address>): Promise<Address> {
    const newAddress = this.addressRepository.create(address);
    return this.addressRepository.save(newAddress);
  }

  async update(address: Partial<Address>): Promise<Address> {
    return this.addressRepository.save(address);
  }

  async delete(id: string): Promise<void> {
    await this.addressRepository.delete(id);
  }
}

