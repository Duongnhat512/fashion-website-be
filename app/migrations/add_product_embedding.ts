import { DataSource } from 'typeorm';
import { AppDataSource } from '../config/data_source';

/**
 * Migration to add embedding column to products table
 * Embedding will be stored as JSON array (vector of 768 dimensions from Gemini)
 */
export async function addProductEmbeddingColumn(): Promise<void> {
  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();

    // Add embedding column as JSONB to store vector array
    await queryRunner.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS embedding JSONB;
    `);

    // Create index for faster JSONB queries (optional, for filtering)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_embedding 
      ON products USING GIN (embedding);
    `);

    console.log('Successfully added embedding column to products table');
    await queryRunner.release();
  } catch (error) {
    console.error('Error adding embedding column:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addProductEmbeddingColumn()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
