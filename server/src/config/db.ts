import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'fiscoone_db',
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
});

export async function connectToDatabase() {
    // In PG, the pool manages connections automatically. 
    // We can just verify connectivity.
    try {
        const client = await pool.connect();
        console.log('✅ Connected to Azure PostgreSQL Database');
        client.release();
        return pool;
    } catch (err) {
        console.error('❌ Database Connection Failed:', err);
        throw err;
    }
}

export { pool };
