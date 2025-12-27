import fs from 'fs';
import path from 'path';
import { pool, connectToDatabase } from '../config/db';

async function seedPlans() {
    try {
        console.log('🔄 Connecting to SQL Server...');
        await connectToDatabase();

        const seedPath = path.join(__dirname, '../../database/sqlserver_seed_plans.sql');
        console.log('📂 Reading seed file:', seedPath);
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log('🚀 Seeding plans...');
        await pool.query(seedSql);

        console.log('✅ Plans seeded (SQL Server).');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to seed plans:', err);
        process.exit(1);
    }
}

seedPlans();
