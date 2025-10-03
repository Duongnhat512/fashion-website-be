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
import stockEntryRouter from './routers/stock_entry.route';

const app: Application = express();

const apiVersion = '/api/v1';

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

app.use(`${apiVersion}/auth`, authRouter);
app.use(`${apiVersion}/users`, userRouter);
app.use(`${apiVersion}/categories`, categoryRouter);
app.use(`${apiVersion}/products`, productRouter);
app.use(`${apiVersion}/orders`, orderRouter);
app.use(`${apiVersion}/warehouses`, warehouseRouter);
app.use(`${apiVersion}/stock-entries`, stockEntryRouter);

export default app;
