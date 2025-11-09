import { ApiResponse } from '../dtos/response/api.response.dto';
import { ColorService } from '../services/color/implements/color.service.implement';
import { Request, Response } from 'express';

export class ColorController {
  private readonly service = new ColorService();

  getColors = async (req: Request, res: Response) => {
    try {
      const colors = await this.service.getColors();
      return res
        .status(200)
        .json(ApiResponse.success('Colors fetched successfully', colors));
    } catch (error) {
      return res
        .status(500)
        .json(
          ApiResponse.error('Error fetching colors', [
            {
              field: 'error',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ]),
        );
    }
  };
}
