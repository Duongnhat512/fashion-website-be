// app/migrations/1731272400000-MigrateProductVariantIds.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateProductVariantIds1731272400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // BƯỚC 1: Tạo cột ID mới và mapping table
    // ========================================
    
    // Tạo sequence cho products
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS product_id_seq START 1;
    `);
    
    // Thêm cột id mới (integer) vào products
    await queryRunner.query(`
      ALTER TABLE products 
      ADD COLUMN id_new INTEGER DEFAULT nextval('product_id_seq');
    `);
    
    // Tạo bảng mapping để track old_id -> new_id
    await queryRunner.query(`
      CREATE TABLE product_id_mapping (
        old_id VARCHAR(255) PRIMARY KEY,
        new_id INTEGER NOT NULL
      );
    `);
    
    // Populate mapping table
    await queryRunner.query(`
      INSERT INTO product_id_mapping (old_id, new_id)
      SELECT id, id_new FROM products;
    `);
    
    // ========================================
    // BƯỚC 2: Update Foreign Keys trong các bảng liên quan
    // ========================================
    
    // VARIANTS table
    await queryRunner.query(`
      ALTER TABLE variants 
      ADD COLUMN product_id_new INTEGER;
    `);
    
    await queryRunner.query(`
      UPDATE variants v
      SET product_id_new = pm.new_id
      FROM product_id_mapping pm
      WHERE v.product_id = pm.old_id;
    `);
    
    // ORDER_ITEMS table
    await queryRunner.query(`
      ALTER TABLE order_items 
      ADD COLUMN product_id_new INTEGER;
    `);
    
    await queryRunner.query(`
      UPDATE order_items oi
      SET product_id_new = pm.new_id
      FROM product_id_mapping pm
      WHERE oi.product_id = pm.old_id;
    `);
    
    // CART_ITEMS table
    await queryRunner.query(`
      ALTER TABLE cart_items 
      ADD COLUMN product_id_new INTEGER;
    `);
    
    await queryRunner.query(`
      UPDATE cart_items ci
      SET product_id_new = pm.new_id
      FROM product_id_mapping pm
      WHERE ci.product_id = pm.old_id;
    `);
    
    // REVIEWS table
    await queryRunner.query(`
      ALTER TABLE reviews 
      ADD COLUMN product_id_new INTEGER;
    `);
    
    await queryRunner.query(`
      UPDATE reviews r
      SET product_id_new = pm.new_id
      FROM product_id_mapping pm
      WHERE r.product_id = pm.old_id;
    `);
    
    // PROMOTION_PRODUCTS table
    await queryRunner.query(`
      ALTER TABLE promotion_products 
      ADD COLUMN product_id_new INTEGER;
    `);
    
    await queryRunner.query(`
      UPDATE promotion_products pp
      SET product_id_new = pm.new_id
      FROM product_id_mapping pm
      WHERE pp.product_id = pm.old_id;
    `);
    
    // ========================================
    // BƯỚC 3: Drop old columns và constraints
    // ========================================
    
    // Drop old foreign keys và columns
    await queryRunner.query(`
      ALTER TABLE variants DROP CONSTRAINT IF EXISTS FK_variants_product;
    `);
    await queryRunner.query(`
      ALTER TABLE variants DROP COLUMN product_id;
    `);
    await queryRunner.query(`
      ALTER TABLE variants RENAME COLUMN product_id_new TO product_id;
    `);
    
    await queryRunner.query(`
      ALTER TABLE order_items DROP CONSTRAINT IF EXISTS FK_order_items_product;
    `);
    await queryRunner.query(`
      ALTER TABLE order_items DROP COLUMN product_id;
    `);
    await queryRunner.query(`
      ALTER TABLE order_items RENAME COLUMN product_id_new TO product_id;
    `);
    
    await queryRunner.query(`
      ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS FK_cart_items_product;
    `);
    await queryRunner.query(`
      ALTER TABLE cart_items DROP COLUMN product_id;
    `);
    await queryRunner.query(`
      ALTER TABLE cart_items RENAME COLUMN product_id_new TO product_id;
    `);
    
    await queryRunner.query(`
      ALTER TABLE reviews DROP CONSTRAINT IF EXISTS FK_reviews_product;
    `);
    await queryRunner.query(`
      ALTER TABLE reviews DROP COLUMN product_id;
    `);
    await queryRunner.query(`
      ALTER TABLE reviews RENAME COLUMN product_id_new TO product_id;
    `);
    
    await queryRunner.query(`
      ALTER TABLE promotion_products DROP CONSTRAINT IF EXISTS FK_promotion_products_product;
    `);
    await queryRunner.query(`
      ALTER TABLE promotion_products DROP COLUMN product_id;
    `);
    await queryRunner.query(`
      ALTER TABLE promotion_products RENAME COLUMN product_id_new TO product_id;
    `);
    
    // ========================================
    // BƯỚC 4: Drop old ID column và rename new ID
    // ========================================
    
    await queryRunner.query(`
      ALTER TABLE products DROP CONSTRAINT IF EXISTS PK_products;
    `);
    await queryRunner.query(`
      ALTER TABLE products DROP COLUMN id;
    `);
    await queryRunner.query(`
      ALTER TABLE products RENAME COLUMN id_new TO id;
    `);
    await queryRunner.query(`
      ALTER TABLE products ADD PRIMARY KEY (id);
    `);
    
    // ========================================
    // BƯỚC 5: Tạo lại Foreign Keys
    // ========================================
    
    await queryRunner.query(`
      ALTER TABLE variants 
      ADD CONSTRAINT FK_variants_product 
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    `);
    
    await queryRunner.query(`
      ALTER TABLE order_items 
      ADD CONSTRAINT FK_order_items_product 
      FOREIGN KEY (product_id) REFERENCES products(id);
    `);
    
    await queryRunner.query(`
      ALTER TABLE cart_items 
      ADD CONSTRAINT FK_cart_items_product 
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    `);
    
    await queryRunner.query(`
      ALTER TABLE reviews 
      ADD CONSTRAINT FK_reviews_product 
      FOREIGN KEY (product_id) REFERENCES products(id);
    `);
    
    await queryRunner.query(`
      ALTER TABLE promotion_products 
      ADD CONSTRAINT FK_promotion_products_product 
      FOREIGN KEY (product_id) REFERENCES products(id);
    `);
    
    // ========================================
    // LÀM TƯƠNG TỰ CHO VARIANTS
    // ========================================
    
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS variant_id_seq START 1;
    `);
    
    await queryRunner.query(`
      ALTER TABLE variants 
      ADD COLUMN id_new INTEGER DEFAULT nextval('variant_id_seq');
    `);
    
    await queryRunner.query(`
      CREATE TABLE variant_id_mapping (
        old_id VARCHAR(255) PRIMARY KEY,
        new_id INTEGER NOT NULL
      );
    `);
    
    await queryRunner.query(`
      INSERT INTO variant_id_mapping (old_id, new_id)
      SELECT id, id_new FROM variants;
    `);
    
    // Update FK trong order_items
    await queryRunner.query(`
      ALTER TABLE order_items ADD COLUMN variant_id_new INTEGER;
    `);
    
    await queryRunner.query(`
      UPDATE order_items oi
      SET variant_id_new = vm.new_id
      FROM variant_id_mapping vm
      WHERE oi.variant_id = vm.old_id;
    `);
    
    // Update FK trong cart_items
    await queryRunner.query(`
      ALTER TABLE cart_items ADD COLUMN variant_id_new INTEGER;
    `);
    
    await queryRunner.query(`
      UPDATE cart_items ci
      SET variant_id_new = vm.new_id
      FROM variant_id_mapping vm
      WHERE ci.variant_id = vm.old_id;
    `);
    
    // Update FK trong inventory
    await queryRunner.query(`
      ALTER TABLE inventory ADD COLUMN variant_id_new INTEGER;
    `);
    
    await queryRunner.query(`
      UPDATE inventory i
      SET variant_id_new = vm.new_id
      FROM variant_id_mapping vm
      WHERE i.variant_id = vm.old_id;
    `);
    
    // Drop old FK và rename
    await queryRunner.query(`
      ALTER TABLE order_items DROP CONSTRAINT IF EXISTS FK_order_items_variant;
      ALTER TABLE order_items DROP COLUMN variant_id;
      ALTER TABLE order_items RENAME COLUMN variant_id_new TO variant_id;
    `);
    
    await queryRunner.query(`
      ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS FK_cart_items_variant;
      ALTER TABLE cart_items DROP COLUMN variant_id;
      ALTER TABLE cart_items RENAME COLUMN variant_id_new TO variant_id;
    `);
    
    await queryRunner.query(`
      ALTER TABLE inventory DROP CONSTRAINT IF EXISTS FK_inventory_variant;
      ALTER TABLE inventory DROP COLUMN variant_id;
      ALTER TABLE inventory RENAME COLUMN variant_id_new TO variant_id;
    `);
    
    // Drop old PK và rename variants.id
    await queryRunner.query(`
      ALTER TABLE variants DROP CONSTRAINT IF EXISTS PK_variants;
      ALTER TABLE variants DROP COLUMN id;
      ALTER TABLE variants RENAME COLUMN id_new TO id;
      ALTER TABLE variants ADD PRIMARY KEY (id);
    `);
    
    // Recreate FK
    await queryRunner.query(`
      ALTER TABLE order_items 
      ADD CONSTRAINT FK_order_items_variant 
      FOREIGN KEY (variant_id) REFERENCES variants(id);
    `);
    
    await queryRunner.query(`
      ALTER TABLE cart_items 
      ADD CONSTRAINT FK_cart_items_variant 
      FOREIGN KEY (variant_id) REFERENCES variants(id);
    `);
    
    await queryRunner.query(`
      ALTER TABLE inventory 
      ADD CONSTRAINT FK_inventory_variant 
      FOREIGN KEY (variant_id) REFERENCES variants(id);
    `);
    
    // Clean up mapping tables
    await queryRunner.query(`DROP TABLE IF EXISTS product_id_mapping;`);
    await queryRunner.query(`DROP TABLE IF EXISTS variant_id_mapping;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic - khôi phục về UUID/string IDs
    // Quá phức tạp để rollback, recommend restore from backup
    throw new Error('Cannot rollback this migration. Restore from backup instead.');
  }
}