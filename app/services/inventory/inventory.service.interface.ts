import { Inventory } from "../../models/inventory.model";

export default interface IInventoryService {
  getAll(): Promise<Inventory[]>;
  getById(id: string): Promise<Inventory>;
  getByWarehouseId(warehouseId: string): Promise<Inventory[]>;
  getByVariantId(variantId: string): Promise<Inventory[]>;
  getByWarehouseIdAndVariantId(warehouseId: string, variantId: string): Promise<Inventory>;
}