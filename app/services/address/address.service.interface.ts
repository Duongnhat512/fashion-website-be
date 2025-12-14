import { CreateAddressRequestDto, UpdateAddressRequestDto } from '../../dtos/request/address/address.request';
import { AddressResponseDto } from '../../dtos/response/address/address.response';

export interface IAddressService {
  createAddress(
    userId: string,
    address: CreateAddressRequestDto,
  ): Promise<AddressResponseDto>;
  updateAddress(
    userId: string,
    address: UpdateAddressRequestDto,
  ): Promise<AddressResponseDto>;
  deleteAddress(userId: string, addressId: string): Promise<void>;
  getAddressById(userId: string, addressId: string): Promise<AddressResponseDto>;
  getAddressesByUserId(userId: string): Promise<AddressResponseDto[]>;
  setDefaultAddress(userId: string, addressId: string): Promise<AddressResponseDto>;
}

