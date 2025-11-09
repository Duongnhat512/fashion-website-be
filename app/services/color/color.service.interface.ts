import { Color } from '../../models/color.model';

export interface IColorService {
  getColors(): Promise<Color[]>;
  createColor(color: Color): Promise<Color>;
  updateColor(color: Color): Promise<Color>;
  deleteColor(id: string): Promise<void>;
}
