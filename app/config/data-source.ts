import 'reflect-metadata';
import { DataSource } from 'typeorm';
import User from '../models/user.model';
import { config } from './env';
import Address from '../models/address.model';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.pg.host,
  port: config.pg.port,
  username: config.pg.user,
  password: config.pg.password,
  database: config.pg.database,
  entities: [User, Address],
  synchronize: true,
  logging: false,
});
