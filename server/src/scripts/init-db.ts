import { pool } from "../config/db";
import fs from 'fs';
import path from 'path';

async function initDb() {
    try {
        console.log('🔄 Connecting to database...');
        const client = await pool.connect();

        console.log('📂 Reading schema file...');
        const schemaPath = path.join(__dirname, '../../database/postgres_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🚀 Applying schema...');
        await client.query(schemaSql);

        console.log('✅ Database initialized successfully!');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to initialize database:', err);
        process.exit(1);
    }
}

initDb();
