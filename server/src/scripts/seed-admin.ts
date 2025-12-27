import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

async function seedAdmin() {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@fiscoone.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!123';
    const role = 'SUPER_ADMIN';

    try {
        const client = await pool.connect();
        const existing = await client.query('SELECT id FROM admin_users WHERE email = $1', [email]);
        if (existing.rowCount && existing.rowCount > 0) {
            console.log('Admin already exists:', email);
            client.release();
            process.exit(0);
            return;
        }

        const hash = await bcrypt.hash(password, 10);
        await client.query(
            `INSERT INTO admin_users (email, password_hash, role, active)
             VALUES ($1, $2, $3, TRUE)`,
            [email, hash, role]
        );

        console.log('Seeded admin user:', email);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Failed to seed admin user:', err);
        process.exit(1);
    }
}

seedAdmin();
