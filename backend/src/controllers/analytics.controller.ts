import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { analyticsSnapshots, instagramAccounts, automations } from '../../../db/schema';
import { eq, inArray, gte, and, sql } from 'drizzle-orm';

export const getAnalyticsOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'User context missing.' } });
    }

    // 1. Get user's linked Instagram Accounts
    const userAccts = await db.select().from(instagramAccounts).where(eq(instagramAccounts.userId, userId));
    if (userAccts.length === 0) {
      return res.json({
        success: true,
        data: {
          dmsSent: 0,
          newLeads: 0,
          engagementRate: '0.0%',
          revenueDriven: '$0.00',
          commentsCount: 0,
          keywordsMatched: 0,
          failuresCount: 0,
        }
      });
    }

    const acctIds = userAccts.map(a => a.id);
    const range = (req.query.range as string) || '30d';

    let startDate: Date | null = null;
    if (range === '7d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === '30d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    const conditions = [inArray(analyticsSnapshots.instagramAccountId, acctIds)];
    if (startDate) {
      conditions.push(gte(analyticsSnapshots.date, startDate.toISOString().split('T')[0]));
    }

    // 2. Aggregate snapshot totals
    const result = await db
      .select({
        totalComments: sql<number>`COALESCE(SUM(${analyticsSnapshots.commentsCount}), 0)`,
        totalKeywords: sql<number>`COALESCE(SUM(${analyticsSnapshots.keywordsMatched}), 0)`,
        totalDms: sql<number>`COALESCE(SUM(${analyticsSnapshots.dmsSent}), 0)`,
        totalFailures: sql<number>`COALESCE(SUM(${analyticsSnapshots.failuresCount}), 0)`,
        totalLeads: sql<number>`COALESCE(SUM(${analyticsSnapshots.leadsCollected}), 0)`,
      })
      .from(analyticsSnapshots)
      .where(and(...conditions));

    const stats = result[0] || { totalComments: 0, totalKeywords: 0, totalDms: 0, totalFailures: 0, totalLeads: 0 };

    const comments = Number(stats.totalComments);
    const keywords = Number(stats.totalKeywords);
    const dms = Number(stats.totalDms);
    const leads = Number(stats.totalLeads);

    const engagementRate = comments > 0 ? ((keywords / comments) * 100).toFixed(1) + '%' : '0.0%';
    const revenueDriven = '$' + (leads * 2.50).toFixed(2);

    return res.json({
      success: true,
      data: {
        dmsSent: dms,
        newLeads: leads,
        engagementRate,
        revenueDriven,
        commentsCount: comments,
        keywordsMatched: keywords,
        failuresCount: Number(stats.totalFailures),
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsTimeSeries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'User context missing.' } });
    }

    const userAccts = await db.select().from(instagramAccounts).where(eq(instagramAccounts.userId, userId));
    if (userAccts.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const acctIds = userAccts.map(a => a.id);
    const range = (req.query.range as string) || '30d';

    let startDate: Date | null = null;
    if (range === '7d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === '30d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    const conditions = [inArray(analyticsSnapshots.instagramAccountId, acctIds)];
    if (startDate) {
      conditions.push(gte(analyticsSnapshots.date, startDate.toISOString().split('T')[0]));
    }

    const series = await db
      .select({
        date: analyticsSnapshots.date,
        comments: sql<number>`COALESCE(SUM(${analyticsSnapshots.commentsCount}), 0)`,
        matches: sql<number>`COALESCE(SUM(${analyticsSnapshots.keywordsMatched}), 0)`,
        dms: sql<number>`COALESCE(SUM(${analyticsSnapshots.dmsSent}), 0)`,
        leads: sql<number>`COALESCE(SUM(${analyticsSnapshots.leadsCollected}), 0)`,
      })
      .from(analyticsSnapshots)
      .where(and(...conditions))
      .groupBy(analyticsSnapshots.date)
      .orderBy(analyticsSnapshots.date);

    return res.json({
      success: true,
      data: series.map(row => ({
        date: row.date,
        comments: Number(row.comments),
        matches: Number(row.matches),
        dms: Number(row.dms),
        leads: Number(row.leads),
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'User context missing.' } });
    }

    const userAccts = await db.select().from(instagramAccounts).where(eq(instagramAccounts.userId, userId));
    if (userAccts.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const acctIds = userAccts.map(a => a.id);

    // Get campaigns for the user's accounts, joined with their summed snapshot metrics
    const campaignStats = await db
      .select({
        id: automations.id,
        name: automations.name,
        status: automations.status,
        flowType: automations.flowType,
        collectLeads: automations.collectLeads,
        comments: sql<number>`COALESCE(SUM(${analyticsSnapshots.commentsCount}), 0)`,
        matches: sql<number>`COALESCE(SUM(${analyticsSnapshots.keywordsMatched}), 0)`,
        dms: sql<number>`COALESCE(SUM(${analyticsSnapshots.dmsSent}), 0)`,
        failures: sql<number>`COALESCE(SUM(${analyticsSnapshots.failuresCount}), 0)`,
        leads: sql<number>`COALESCE(SUM(${analyticsSnapshots.leadsCollected}), 0)`,
      })
      .from(automations)
      .leftJoin(analyticsSnapshots, eq(automations.id, analyticsSnapshots.automationId))
      .where(inArray(automations.instagramAccountId, acctIds))
      .groupBy(automations.id)
      .orderBy(sql`COALESCE(SUM(${analyticsSnapshots.commentsCount}), 0) DESC`);

    return res.json({
      success: true,
      data: campaignStats.map(c => ({
        ...c,
        comments: Number(c.comments),
        matches: Number(c.matches),
        dms: Number(c.dms),
        failures: Number(c.failures),
        leads: Number(c.leads),
      }))
    });
  } catch (error) {
    next(error);
  }
};
