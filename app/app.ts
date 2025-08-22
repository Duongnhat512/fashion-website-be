import express, { Application } from 'express';
import { initPg } from './config/pg.config';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import userRouter from './routers/user.router';
import { AppDataSource } from './config/data-source';

const app: Application = express();

initPg();

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

app.use('/api/v1/users', userRouter);

export default app;
