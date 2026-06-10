import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { leads, instagramAccounts, automations } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';

export class LeadsController {
  // GET /api/leads
  static async getLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User session not synchronized.',
          },
        });
      }

      const list = await db
        .select({
          id: leads.id,
          automationId: leads.automationId,
          instagramAccountId: leads.instagramAccountId,
          igUserId: leads.igUserId,
          igUsername: leads.igUsername,
          email: leads.email,
          phone: leads.phone,
          fullName: leads.fullName,
          sourceComment: leads.sourceComment,
          capturedAt: leads.capturedAt,
          createdAt: leads.createdAt,
          automationName: automations.name,
          accountUsername: instagramAccounts.username,
        })
        .from(leads)
        .innerJoin(
          instagramAccounts,
          eq(leads.instagramAccountId, instagramAccounts.id)
        )
        .leftJoin(
          automations,
          eq(leads.automationId, automations.id)
        )
        .where(eq(instagramAccounts.userId, user.id))
        .orderBy(sql`${leads.capturedAt} DESC`);

      return res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/leads/export
  static async exportLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User session not synchronized.',
          },
        });
      }

      // Query database
      const list = await db
        .select({
          fullName: leads.fullName,
          email: leads.email,
          phone: leads.phone,
          igUsername: leads.igUsername,
          igUserId: leads.igUserId,
          automationName: automations.name,
          accountUsername: instagramAccounts.username,
          capturedAt: leads.capturedAt,
        })
        .from(leads)
        .innerJoin(
          instagramAccounts,
          eq(leads.instagramAccountId, instagramAccounts.id)
        )
        .leftJoin(
          automations,
          eq(leads.automationId, automations.id)
        )
        .where(eq(instagramAccounts.userId, user.id))
        .orderBy(sql`${leads.capturedAt} DESC`);

      // Set streaming headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="gramflow-leads.csv"');

      // Write header line
      res.write('Full Name,Email,Phone,Instagram Username,Instagram User ID,Campaign Name,Account Username,Captured At\n');

      // Stream CSV rows
      for (const row of list) {
        const fullNameEscaped = `"${(row.fullName || '').replace(/"/g, '""')}"`;
        const emailEscaped = `"${(row.email || '').replace(/"/g, '""')}"`;
        const phoneEscaped = `"${(row.phone || '').replace(/"/g, '""')}"`;
        const igUsernameEscaped = `"${(row.igUsername || '').replace(/"/g, '""')}"`;
        const igUserIdEscaped = `"${(row.igUserId || '').replace(/"/g, '""')}"`;
        const automationNameEscaped = `"${(row.automationName || '').replace(/"/g, '""')}"`;
        const accountUsernameEscaped = `"${(row.accountUsername || '').replace(/"/g, '""')}"`;
        const capturedAtEscaped = `"${row.capturedAt ? row.capturedAt.toISOString() : ''}"`;

        const csvRow = `${fullNameEscaped},${emailEscaped},${phoneEscaped},${igUsernameEscaped},${igUserIdEscaped},${automationNameEscaped},${accountUsernameEscaped},${capturedAtEscaped}\n`;
        res.write(csvRow);
      }

      res.end();
    } catch (error) {
      next(error);
    }
  }
}
