import express, { Application } from 'express';
import { initPg } from './config/pg.config';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import userRouter from './routers/user.router';
import { AppDataSource } from './config/data_source';
import categoryRouter from './routers/category.route';
import productRouter from './routers/product.route';
import authRouter from './routers/auth.route';
import { initRedis } from './config/redis.config';
import { initializeProductSearch } from './utils/initialize_search';
import orderRouter from './routers/order.route';
import { warehouseRouter } from './routers/warehouse.route';

const app: Application = express();

async function initializeApp() {
  try {
    await initPg();
    await AppDataSource.initialize();
    await initRedis();
    await initializeProductSearch();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

initializeApp();

app.use(morgan('dev'));
app.use(
  bodyParser.urlencoded({
    extended: false,
  }),
);
app.use(bodyParser.json());
app.use(
  cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/warehouses', warehouseRouter);

export default app;
