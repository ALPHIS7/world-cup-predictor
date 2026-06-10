// Run: npm run migrate
// Applies schema.sql to the configured SQLite database.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../../Database/schema.sql');

try {
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(sql);
  logger.info('Migration complete: schema applied.');
  process.exit(0);
} catch (err) {
  logger.error('Migration failed:', err);
  process.exit(1);
}
