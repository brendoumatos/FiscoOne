import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../config/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// Helper to generate Token
const generateToken = (user: any) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

import { validate } from '../middleware/validate';
import { loginSchema, signupSchema } from '../schemas';

// POST /auth/signup
router.post('/signup', validate(signupSchema), async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    try {
        const pool = await connectToDatabase();

        // 1. Check if user exists
        const checkResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert User
        const insertResult = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, role, full_name`,
            [name, email, hashedPassword, role]
        );

        const newUser = insertResult.rows[0];

        // 4. Generate Token
        const token = generateToken(newUser);

        res.status(201).json({
            user: {
                id: newUser.id,
                name: newUser.full_name,
                email: newUser.email,
                role: newUser.role
            },
            token
        });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const pool = await connectToDatabase();

        // 1. Find User
        const result = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.password_hash, u.role, c.id as company_id
             FROM users u
             LEFT JOIN companies c ON c.owner_id = u.id
             WHERE u.email = $1`,
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Compare Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. Generate Token
        const token = generateToken(user);

        res.json({
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
                companyId: user.company_id || undefined
            },
            token
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
