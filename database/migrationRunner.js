import { query, transaction } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Migration Runner
 * Ensures all tables exist for persistent data storage
 */

class MigrationRunner {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.migrationsTable = 'schema_migrations';
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    logger.info('🔄 Running database migrations for persistent data storage');

    try {
      // Create migrations tracking table
      await this.createMigrationsTable();

      // Get list of migration files
      const migrationFiles = this.getMigrationFiles();

      // Run each migration in order
      for (const file of migrationFiles) {
        const migrationName = path.basename(file, '.js');

        // Check if migration already ran
        const alreadyRan = await this.migrationRan(migrationName);

        if (!alreadyRan) {
          logger.info(`🚀 Running migration: ${migrationName}`);

          // Import and run migration
          const migration = await import(file);
          await transaction(async (client) => {
            await migration.up(client);

            // Record that migration ran
            await client.query(
              `INSERT INTO ${this.migrationsTable} (name, run_at) VALUES ($1, $2)`,
              [migrationName, new Date()]
            );
          });

          logger.info(`✅ Migration completed: ${migrationName}`);
        } else {
          logger.info(`⏭️  Migration already ran: ${migrationName}`);
        }
      }

      logger.info('🎯 All database migrations completed');

    } catch (error) {
      logger.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Create migrations tracking table
   */
  async createMigrationsTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Check if migration already ran
   */
  async migrationRan(migrationName) {
    const result = await query(
      `SELECT name FROM ${this.migrationsTable} WHERE name = $1`,
      [migrationName]
    );

    return result.rows.length > 0;
  }

  /**
   * Get migration files in order
   */
  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    return fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort()
      .map(file => path.join(this.migrationsDir, file));
  }

  /**
   * Rollback last migration (for development)
   */
  async rollbackLast() {
    logger.info('⬅️  Rolling back last migration');

    try {
      // Get last migration
      const lastMigration = await query(
        `SELECT name FROM ${this.migrationsTable} ORDER BY run_at DESC LIMIT 1`
      );

      if (lastMigration.rows.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }

      const migrationName = lastMigration.rows[0].name;
      const migrationFile = path.join(this.migrationsDir, migrationName + '.js');

      if (fs.existsSync(migrationFile)) {
        const migration = await import(migrationFile);

        await transaction(async (client) => {
          await migration.down(client);

          // Remove from migrations table
          await client.query(
            `DELETE FROM ${this.migrationsTable} WHERE name = $1`,
            [migrationName]
          );
        });

        logger.info(`✅ Rolled back migration: ${migrationName}`);
      }

    } catch (error) {
      logger.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}

export const migrationRunner = new MigrationRunner();

/**
 * Initialize database with migrations
 */
export async function initializeDatabaseWithMigrations() {
  await migrationRunner.runMigrations();
}

export default migrationRunner;
