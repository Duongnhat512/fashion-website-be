import {
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
} from '../../dtos/request/product/warehouse.request';
import { Warehouse } from '../../models/warehouse.model';

export interface IWarehouseService {
  create(warehouse: CreateWarehouseRequest): Promise<Warehouse>;
  update(warehouse: UpdateWarehouseRequest): Promise<Warehouse>;
}
