export class VariantRequestDto {
  sku: string;
  colorId: string;
  size: string;
  price: number;
  discountPrice: number;
  discountPercent: number;
  stock: number;
  imageUrl: string;
  onSales: boolean;
  saleNote: string;
}
