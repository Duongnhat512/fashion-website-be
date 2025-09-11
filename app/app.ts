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

const app: Application = express();

initPg();
initRedis();

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((error: any) =>
    console.error('Error during Data Source initialization', error),
  );

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

export default app;
