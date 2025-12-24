import { pool } from '../config/db';
import { creditService } from './credit';

export const referralService = {
    async getOrCreateCode(companyId: string): Promise<string> {
        // Check existing
        const res = await pool.query(`SELECT code FROM referral_codes WHERE company_id = $1 AND is_active = true`, [companyId]);
        if (res.rows.length > 0) return res.rows[0].code;

        // Generate new
        // Simple random code
        const code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        await pool.query(
            `INSERT INTO referral_codes (company_id, code) VALUES ($1, $2)`,
            [companyId, code]
        );
        return code;
    },

    async registerInvite(referralCode: string, invitedCompanyId: string) {
        // Find referrer
        const codeRes = await pool.query(`SELECT id, company_id FROM referral_codes WHERE code = $1`, [referralCode]);
        if (codeRes.rows.length === 0) return false; // Invalid code

        const referrerId = codeRes.rows[0].company_id;
        const codeId = codeRes.rows[0].id;

        // Prevent self-referral
        if (referrerId === invitedCompanyId) return false;

        // Insert invite
        await pool.query(
            `INSERT INTO referral_invites (referral_code_id, invited_company_id, status)
             VALUES ($1, $2, 'PENDING')
             ON CONFLICT (invited_company_id) DO NOTHING`,
            [codeId, invitedCompanyId]
        );
        return true;
    },

    async checkAndReward(invitedCompanyId: string, planCode: string) {
        // 1. Find pending invite
        const inviteRes = await pool.query(
            `SELECT ri.id, ri.status, rc.company_id as referrer_id 
             FROM referral_invites ri
             JOIN referral_codes rc ON ri.referral_code_id = rc.id
             WHERE ri.invited_company_id = $1 AND ri.status = 'PENDING'`,
            [invitedCompanyId]
        );

        if (inviteRes.rows.length === 0) return; // No pending invite

        const invite = inviteRes.rows[0];

        // 2. Check Eligibility (PRO or ENTERPRISE)
        const isEligible = ['PRO', 'ENTERPRISE'].includes(planCode);

        if (isEligible) {
            // 3. Grant Reward to Referrer
            // Reward: 10 Extra Invoices, valid for 90 days
            await creditService.grantCredit(invite.referrer_id, 'EXTRA_INVOICES', 10, 90, 'REFERRAL_REWARD');

            // 4. Update Invite Status
            await pool.query(
                `UPDATE referral_invites SET status = 'REWARDED', eligible_plan_code = $1 WHERE id = $2`,
                [planCode, invite.id]
            );
        } else {
            // Just mark activated but not rewarded yet? Or keep pending until upgrade?
            // "Active" but waiting for higher plan.
            await pool.query(
                `UPDATE referral_invites SET status = 'ACTIVATED', eligible_plan_code = $1 WHERE id = $2`,
                [planCode, invite.id]
            );
        }
    },

    async getDashboardData(companyId: string) {
        const code = await this.getOrCreateCode(companyId);

        // Invites stats
        const invitesRes = await pool.query(
            `WITH CompanyCodes AS (
                SELECT id FROM referral_codes WHERE company_id = $1
             )
             SELECT status, count(*) as count 
             FROM referral_invites 
             WHERE referral_code_id IN (SELECT id FROM CompanyCodes)
             GROUP BY status`,
            [companyId]
        );

        return {
            code,
            referralLink: `https://app.fiscoone.com.br/register?ref=${code}`,
            stats: invitesRes.rows
        };
    }
};
