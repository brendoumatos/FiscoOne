import { pool, connectToDatabase } from "../config/db";
import fs from 'fs';
import path from 'path';

async function initDb() {
    try {
        console.log('🔄 Connecting to SQL Server...');
        await connectToDatabase();

        console.log('📂 Reading schema file...');
        const schemaPath = path.join(__dirname, '../../database/sqlserver_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🚀 Applying schema (may take a few seconds)...');
        await pool.query(schemaSql);

        console.log('✅ Database initialized successfully (SQL Server).');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to initialize database:', err);
        process.exit(1);
    }
}

initDb();
