import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../config/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
    throw new Error('JWT secrets must be set via environment variables');
}

// Helper to generate Token
const generateTokenPair = (user: any) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, companyId: user.company_id },
        JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        REFRESH_SECRET,
        { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
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

        // 4. Generate Tokens
        const { accessToken, refreshToken } = generateTokenPair(newUser);

        // Persist refresh token
        await pool.query(
            `INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
            [newUser.id, refreshToken]
        );

        res.status(201).json({
            user: {
                id: newUser.id,
                name: newUser.full_name,
                email: newUser.email,
                role: newUser.role
            },
            token: accessToken,
            refreshToken
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

        // 3. Generate Tokens
        const { accessToken, refreshToken } = generateTokenPair(user);

        await pool.query(
            `INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
            [user.id, refreshToken]
        );

        res.json({
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
                companyId: user.company_id || undefined
            },
            token: accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    try {
        const pool = await connectToDatabase();
        const stored = await pool.query('SELECT user_id FROM sessions WHERE refresh_token = $1 AND expires_at > NOW()', [refreshToken]);
        if (stored.rows.length === 0) return res.status(401).json({ message: 'Invalid refresh token' });

        const payload: any = jwt.verify(refreshToken, REFRESH_SECRET);
        const userRes = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [payload.id]);
        if (userRes.rows.length === 0) return res.status(401).json({ message: 'User not found' });

        const user = userRes.rows[0];
        const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '15m' });

        res.json({ token: accessToken });
    } catch (error) {
        console.error('Refresh Error:', error);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
});

export default router;
