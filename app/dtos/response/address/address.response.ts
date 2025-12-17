import Address from '../../../models/address.model';

export class AddressResponseDto {
  id: string;
  fullName: string;
  phone: string;
  fullAddress: string;
  city: string;
  district: string;
  ward: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(address: Address) {
    this.id = address.id;
    this.fullName = address.fullName;
    this.phone = address.phone;
    this.fullAddress = address.fullAddress;
    this.city = address.city;
    this.district = address.district;
    this.ward = address.ward;
    this.isDefault = address.isDefault;
    this.createdAt = address.createdAt;
    this.updatedAt = address.updatedAt;
  }
}

