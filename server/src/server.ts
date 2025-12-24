import app from './app';
import { connectToDatabase } from './config/db';
import { seedPlans } from './scripts/seed_plans';

const PORT = process.env.PORT || 3001;

const startServer = async () => {
    try {
        await connectToDatabase();

        // Auto-seed plans on startup for simplicity in this demo
        await seedPlans();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
