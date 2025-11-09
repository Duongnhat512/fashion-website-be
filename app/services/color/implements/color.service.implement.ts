import { Color } from '../../../models/color.model';

import { ColorRepository } from '../../../repositories/color.repository';
import { IColorService } from '../color.service.interface';

export class ColorService implements IColorService {
  private readonly repo: ColorRepository;

  constructor() {
    this.repo = new ColorRepository();
  }
  getColors(): Promise<Color[]> {
    return this.repo.findAll();
  }
  createColor(color: Color): Promise<Color> {
    return this.repo.create(color);
  }
  updateColor(color: Color): Promise<Color> {
    return this.repo.update(color.id, color);
  }
  deleteColor(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
