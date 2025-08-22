// import { NextFunction, Request, Response } from 'express';
// import { ApiResponse } from '../dtos/response/api.response.dto';
// import jwt, { JwtPayload } from 'jsonwebtoken';
// import config from '../config/env.config';

// export const authMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) {
//     return res.status(401).json(ApiResponse.error('Unauthorized'));
//   }

//   const decoded = jwt.verify(token, config.jwtSecret);
//   req.user = decoded as TokenPayloadDto;
//   next();
// };
