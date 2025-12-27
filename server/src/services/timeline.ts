import { pool } from '../config/db';

export interface TimelineEvent {
    id: string;
    type: string;
    title: string;
    description?: string;
    metadata: any;
    createdAt: Date;
}

export const timelineService = {
    async recordEvent(companyId: string, type: string, title: string, description?: string, metadata: any = {}) {
        try {
            await pool.query(
                `INSERT INTO fiscal_timeline_events (company_id, type, title, description, metadata_json)
                 VALUES ($1, $2, $3, $4, $5)`,
                [companyId, type, title, description, JSON.stringify(metadata)]
            );
        } catch (error) {
            console.error('Failed to record timeline event:', error);
            // Non-blocking error - timeline failure shouldn't stop main flow
        }
    },

    async getTimeline(companyId: string, type?: string, limit: number = 20) {
        let query = `SELECT * FROM fiscal_timeline_events WHERE company_id = $1`;
        const params: any[] = [companyId];

        const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));

        if (type) {
            query += ` AND type = $2`;
            params.push(type);
        }

        query += ` ORDER BY created_at DESC OFFSET 0 ROWS FETCH NEXT ${safeLimit} ROWS ONLY`;

        const result = await pool.query(query, params);

        return result.rows.map(row => ({
            id: row.id,
            type: row.type,
            title: row.title,
            description: row.description,
            metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
            createdAt: row.created_at
        }));
    }
};
