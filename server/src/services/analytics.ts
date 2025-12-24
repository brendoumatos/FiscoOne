import { pool } from '../config/db';

export const analyticsService = {
    async trackEvent(eventName: string, payload: any) {
        // In a real Azure setup, this would push to Event Hubs or stick in Data Lake
        // For now, we persist to PostgreSQL table acting as a buffer
        await pool.query(
            `INSERT INTO analytics_events (event_name, payload_json) VALUES ($1, $2)`,
            [eventName, JSON.stringify(payload)]
        );
        console.log(`[Analytics] ${eventName}`, payload);
    }
};
