import { IAddressService } from '../address.service.interface';
import { AddressRepository } from '../../../repositories/address.repository';
import {
  CreateAddressRequestDto,
  UpdateAddressRequestDto,
} from '../../../dtos/request/address/address.request';
import { AddressResponseDto } from '../../../dtos/response/address/address.response';
import Address from '../../../models/address.model';

export class AddressService implements IAddressService {
  private readonly addressRepository: AddressRepository;

  constructor() {
    this.addressRepository = new AddressRepository();
  }

  async createAddress(
    userId: string,
    addressDto: CreateAddressRequestDto,
  ): Promise<AddressResponseDto> {
    // If this is set as default, unset other default addresses
    if (addressDto.isDefault) {
      await this.unsetDefaultAddresses(userId);
    }

    const address = await this.addressRepository.create({
      ...addressDto,
      user: { id: userId } as any,
      isDefault: addressDto.isDefault ?? false,
    });

    return new AddressResponseDto(address);
  }

  async updateAddress(
    userId: string,
    addressDto: UpdateAddressRequestDto,
  ): Promise<AddressResponseDto> {
    // Verify address belongs to user
    const existingAddress = await this.addressRepository.findById(addressDto.id);
    if (!existingAddress) {
      throw new Error('Không tìm thấy địa chỉ');
    }

    if (existingAddress.user.id !== userId) {
      throw new Error('Bạn không có quyền cập nhật địa chỉ này');
    }

    // If setting as default, unset other default addresses
    if (addressDto.isDefault === true) {
      await this.unsetDefaultAddresses(userId, addressDto.id);
    }

    const updatedAddress = await this.addressRepository.update({
      ...addressDto,
      id: addressDto.id,
    });

    return new AddressResponseDto(updatedAddress);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    // Verify address belongs to user
    const address = await this.addressRepository.findById(addressId);
    if (!address) {
      throw new Error('Không tìm thấy địa chỉ');
    }

    if (address.user.id !== userId) {
      throw new Error('Bạn không có quyền xóa địa chỉ này');
    }

    await this.addressRepository.delete(addressId);
  }

  async getAddressById(
    userId: string,
    addressId: string,
  ): Promise<AddressResponseDto> {
    const address = await this.addressRepository.findById(addressId);
    if (!address) {
      throw new Error('Không tìm thấy địa chỉ');
    }

    if (address.user.id !== userId) {
      throw new Error('Bạn không có quyền xem địa chỉ này');
    }

    return new AddressResponseDto(address);
  }

  async getAddressesByUserId(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.addressRepository.findByUserId(userId);
    return addresses.map((address) => new AddressResponseDto(address));
  }

  async setDefaultAddress(
    userId: string,
    addressId: string,
  ): Promise<AddressResponseDto> {
    // Verify address belongs to user
    const address = await this.addressRepository.findById(addressId);
    if (!address) {
      throw new Error('Không tìm thấy địa chỉ');
    }

    if (address.user.id !== userId) {
      throw new Error('Bạn không có quyền thay đổi địa chỉ này');
    }

    // Unset other default addresses
    await this.unsetDefaultAddresses(userId, addressId);

    // Set this address as default
    const updatedAddress = await this.addressRepository.update({
      id: addressId,
      isDefault: true,
    });

    return new AddressResponseDto(updatedAddress);
  }

  private async unsetDefaultAddresses(
    userId: string,
    excludeId?: string,
  ): Promise<void> {
    const addresses = await this.addressRepository.findByUserId(userId);
    for (const address of addresses) {
      if (address.isDefault && address.id !== excludeId) {
        await this.addressRepository.update({
          id: address.id,
          isDefault: false,
        });
      }
    }
  }
}

