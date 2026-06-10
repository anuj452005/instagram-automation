import { Request, Response } from 'express';
import { db } from '../config/db';
import { automations, leads } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { LeadParserService } from '../services/lead-parser.service';
import { AnalyticsService } from '../services/analytics.service';
import crypto from 'crypto';

export class PublicLeadsController {
  // GET /api/public/campaigns/:token
  static async getCampaign(req: Request, res: Response) {
    try {
      const { token } = req.params;
      
      const [campaign] = await db
        .select({
          id: automations.id,
          name: automations.name,
          collectLeads: automations.collectLeads,
          leadFields: automations.leadFields,
          instagramAccountId: automations.instagramAccountId,
        })
        .from(automations)
        .where(
          and(
            eq(automations.landingPageToken, token),
            eq(automations.status, 'active')
          )
        )
        .limit(1);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found or inactive' });
      }

      return res.status(200).json(campaign);
    } catch (error: any) {
      console.error('❌ [PublicLeadsController] Error in getCampaign:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/public/leads/submit
  static async submitLead(req: Request, res: Response) {
    try {
      const { landingPageToken, email, phone, fullName } = req.body;

      if (!landingPageToken) {
        return res.status(422).json({ error: 'Missing landingPageToken' });
      }

      // 1. Fetch active campaign
      const [campaign] = await db
        .select()
        .from(automations)
        .where(
          and(
            eq(automations.landingPageToken, landingPageToken),
            eq(automations.status, 'active')
          )
        )
        .limit(1);

      if (!campaign) {
        return res.status(422).json({ error: 'Invalid or inactive campaign token' });
      }

      // 2. Validate required fields according to leadFields
      const fields = campaign.leadFields || ['email'];
      const errors: string[] = [];

      let parsedEmail: string | null = null;
      let parsedPhone: string | null = null;

      if (fields.includes('email')) {
        if (!email) {
          errors.push('Email address is required.');
        } else {
          parsedEmail = LeadParserService.parseEmail(email);
          if (!parsedEmail) {
            errors.push('Please enter a valid email address.');
          }
        }
      }

      if (fields.includes('phone')) {
        if (!phone) {
          errors.push('Phone number is required.');
        } else {
          parsedPhone = LeadParserService.parseIndianPhone(phone);
          if (!parsedPhone) {
            errors.push('Please enter a valid 10-digit phone number.');
          }
        }
      }

      if (fields.includes('fullName')) {
        if (!fullName || !fullName.trim()) {
          errors.push('Full name is required.');
        }
      }

      if (errors.length > 0) {
        return res.status(422).json({ errors });
      }

      // 3. Generate unique placeholder igUserId for database constraints
      const placeholderIgUserId = `web_${crypto.randomUUID()}`;

      // 4. Save to database
      try {
        await db.insert(leads).values({
          automationId: campaign.id,
          instagramAccountId: campaign.instagramAccountId,
          igUserId: placeholderIgUserId,
          igUsername: 'WebVisitor',
          email: parsedEmail || email || null,
          phone: parsedPhone || phone || null,
          fullName: fullName?.trim() || null,
          sourceComment: 'Landing Page Form Submission',
        });
      } catch (dbErr: any) {
        if (dbErr.code === '23505') {
          return res.status(422).json({ error: 'You have already submitted this form.' });
        }
        throw dbErr;
      }

      // 5. Track event
      await AnalyticsService.trackEvent({
        instagramAccountId: campaign.instagramAccountId,
        automationId: campaign.id,
        eventType: 'lead_collected',
        payload: { email: parsedEmail, phone: parsedPhone, fullName },
      });

      return res.status(200).json({
        success: true,
        message: 'Lead captured successfully',
      });
    } catch (error: any) {
      console.error('❌ [PublicLeadsController] Error in submitLead:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
