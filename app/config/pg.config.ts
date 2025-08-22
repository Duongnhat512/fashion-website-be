import { Pool } from 'pg';
import { config } from './env';

const pool = new Pool({
  host: config.pg.host,
  port: config.pg.port,
  user: config.pg.user,
  password: config.pg.password,
  database: config.pg.database,
});

export async function initPg(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Postgres connected');
  } catch (err) {
    console.error('Postgres connection error', err);
    process.exit(1);
  }
}

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
