import { AppDataSource } from '../config/data_source';

export async function addVoucherTables(): Promise<void> {
  const dataSource = AppDataSource;
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS vouchers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) UNIQUE NOT NULL,
          title VARCHAR(255),
          description TEXT,
          discount_percentage FLOAT NOT NULL,
          max_discount_value DOUBLE PRECISION,
          min_order_value DOUBLE PRECISION DEFAULT 0,
          usage_limit INT,
          usage_limit_per_user INT,
          used_count INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          is_stackable BOOLEAN DEFAULT FALSE,
          start_date TIMESTAMPTZ,
          end_date TIMESTAMPTZ,
          created_by VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS voucher_usages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          usage_count INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT uq_voucher_usage UNIQUE (voucher_id, user_id)
        );
      `);

      await queryRunner.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES vouchers(id),
        ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(50);
      `);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('Failed to run voucher migration', error);
    throw error;
  }
}

if (require.main === module) {
  addVoucherTables()
    .then(() => {
      console.log('Voucher tables created successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Voucher migration failed', error);
      process.exit(1);
    });
}

