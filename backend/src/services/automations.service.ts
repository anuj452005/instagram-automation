import { db } from '../config/db';
import { automations, automationKeywords, instagramAccounts } from '../../../db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

export interface KeywordPayload {
  keyword: string;
  matchType?: 'exact' | 'contains' | 'starts_with';
}

export interface CreateAutomationPayload {
  instagramAccountId: string;
  name: string;
  flowType: 'dm' | 'landing_page';
  dmTemplate: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  postId?: string | null;
  postUrl?: string | null;
  postType?: 'FEED' | 'REEL' | 'STORY' | null;
  collectLeads?: boolean;
  leadFields?: string[];
  landingPageToken?: string | null;
  alsoReplyComment?: boolean;
  commentReplyText?: string | null;
  scheduledActivateAt?: string | null;
  keywords: KeywordPayload[];
}

export interface UpdateAutomationPayload {
  instagramAccountId?: string;
  name?: string;
  flowType?: 'dm' | 'landing_page';
  dmTemplate?: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  postId?: string | null;
  postUrl?: string | null;
  postType?: 'FEED' | 'REEL' | 'STORY' | null;
  collectLeads?: boolean;
  leadFields?: string[];
  landingPageToken?: string | null;
  alsoReplyComment?: boolean;
  commentReplyText?: string | null;
  scheduledActivateAt?: string | null;
  keywords?: KeywordPayload[];
}

export class AutomationsService {
  /**
   * Create a new automation campaign with keywords.
   */
  static async createAutomation(userId: string, data: CreateAutomationPayload) {
    return await db.transaction(async (tx) => {
      // 1. Verify Instagram Account tenancy
      const [account] = await tx
        .select()
        .from(instagramAccounts)
        .where(
          and(
            eq(instagramAccounts.id, data.instagramAccountId),
            eq(instagramAccounts.userId, userId)
          )
        )
        .limit(1);

      if (!account) {
        throw new Error('UNAUTHORIZED_ACCOUNT');
      }

      // 2. Insert automation row
      const [newAutomation] = await tx
        .insert(automations)
        .values({
          instagramAccountId: data.instagramAccountId,
          name: data.name,
          flowType: data.flowType,
          dmTemplate: data.dmTemplate,
          status: data.status || 'draft',
          postId: data.postId || null,
          postUrl: data.postUrl || null,
          postType: data.postType || null,
          collectLeads: data.collectLeads ?? false,
          leadFields: data.leadFields || ['email'],
          landingPageToken: data.landingPageToken || null,
          alsoReplyComment: data.alsoReplyComment ?? false,
          commentReplyText: data.commentReplyText || null,
          scheduledActivateAt: data.scheduledActivateAt
            ? new Date(data.scheduledActivateAt)
            : null,
        })
        .returning();

      // 3. Insert keywords if provided
      if (data.keywords && data.keywords.length > 0) {
        await tx.insert(automationKeywords).values(
          data.keywords.map((k) => ({
            automationId: newAutomation.id,
            keyword: k.keyword.trim(),
            matchType: k.matchType || 'exact',
          }))
        );
      }

      // 4. Retrieve inserted keywords to return full object
      const createdKeywords = await tx
        .select({
          id: automationKeywords.id,
          keyword: automationKeywords.keyword,
          matchType: automationKeywords.matchType,
        })
        .from(automationKeywords)
        .where(eq(automationKeywords.automationId, newAutomation.id));

      return {
        ...newAutomation,
        keywords: createdKeywords,
      };
    });
  }

  /**
   * Get all automations for a tenant user.
   */
  static async getAutomations(userId: string) {
    // 1. Fetch automations joined with verified owned accounts
    const userAutomations = await db
      .select({
        id: automations.id,
        instagramAccountId: automations.instagramAccountId,
        name: automations.name,
        status: automations.status,
        postId: automations.postId,
        postUrl: automations.postUrl,
        postType: automations.postType,
        flowType: automations.flowType,
        dmTemplate: automations.dmTemplate,
        collectLeads: automations.collectLeads,
        leadFields: automations.leadFields,
        landingPageToken: automations.landingPageToken,
        alsoReplyComment: automations.alsoReplyComment,
        commentReplyText: automations.commentReplyText,
        scheduledActivateAt: automations.scheduledActivateAt,
        createdAt: automations.createdAt,
        updatedAt: automations.updatedAt,
        instagramAccountUsername: instagramAccounts.username,
      })
      .from(automations)
      .innerJoin(
        instagramAccounts,
        eq(automations.instagramAccountId, instagramAccounts.id)
      )
      .where(eq(instagramAccounts.userId, userId))
      .orderBy(desc(automations.createdAt));

    if (userAutomations.length === 0) {
      return [];
    }

    // 2. Fetch all keywords for these automations (1 query to prevent N+1)
    const automationIds = userAutomations.map((a) => a.id);
    const keywordsList = await db
      .select({
        id: automationKeywords.id,
        automationId: automationKeywords.automationId,
        keyword: automationKeywords.keyword,
        matchType: automationKeywords.matchType,
      })
      .from(automationKeywords)
      .where(inArray(automationKeywords.automationId, automationIds));

    // 3. Merge keywords into automations mapping
    return userAutomations.map((automation) => ({
      ...automation,
      keywords: keywordsList
        .filter((k) => k.automationId === automation.id)
        .map((k) => ({
          id: k.id,
          keyword: k.keyword,
          matchType: k.matchType,
        })),
    }));
  }

  /**
   * Get a single automation by ID for a tenant user.
   */
  static async getAutomationById(userId: string, id: string) {
    const [automation] = await db
      .select({
        id: automations.id,
        instagramAccountId: automations.instagramAccountId,
        name: automations.name,
        status: automations.status,
        postId: automations.postId,
        postUrl: automations.postUrl,
        postType: automations.postType,
        flowType: automations.flowType,
        dmTemplate: automations.dmTemplate,
        collectLeads: automations.collectLeads,
        leadFields: automations.leadFields,
        landingPageToken: automations.landingPageToken,
        alsoReplyComment: automations.alsoReplyComment,
        commentReplyText: automations.commentReplyText,
        scheduledActivateAt: automations.scheduledActivateAt,
        createdAt: automations.createdAt,
        updatedAt: automations.updatedAt,
        instagramAccountUsername: instagramAccounts.username,
      })
      .from(automations)
      .innerJoin(
        instagramAccounts,
        eq(automations.instagramAccountId, instagramAccounts.id)
      )
      .where(
        and(
          eq(automations.id, id),
          eq(instagramAccounts.userId, userId)
        )
      )
      .limit(1);

    if (!automation) {
      throw new Error('NOT_FOUND');
    }

    const keywords = await db
      .select({
        id: automationKeywords.id,
        keyword: automationKeywords.keyword,
        matchType: automationKeywords.matchType,
      })
      .from(automationKeywords)
      .where(eq(automationKeywords.automationId, id));

    return {
      ...automation,
      keywords,
    };
  }

  /**
   * Update an automation campaign inside a transaction.
   */
  static async updateAutomation(userId: string, id: string, data: UpdateAutomationPayload) {
    return await db.transaction(async (tx) => {
      // 1. Verify that the automation exists and belongs to the user
      const [existing] = await tx
        .select({
          id: automations.id,
          instagramAccountId: automations.instagramAccountId,
        })
        .from(automations)
        .innerJoin(
          instagramAccounts,
          eq(automations.instagramAccountId, instagramAccounts.id)
        )
        .where(
          and(
            eq(automations.id, id),
            eq(instagramAccounts.userId, userId)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      // 2. If updating instagramAccountId, verify user owns the new account
      if (data.instagramAccountId && data.instagramAccountId !== existing.instagramAccountId) {
        const [account] = await tx
          .select()
          .from(instagramAccounts)
          .where(
            and(
              eq(instagramAccounts.id, data.instagramAccountId),
              eq(instagramAccounts.userId, userId)
            )
          )
          .limit(1);

        if (!account) {
          throw new Error('UNAUTHORIZED_ACCOUNT');
        }
      }

      // 3. Perform update of automation details
      const [updatedAutomation] = await tx
        .update(automations)
        .set({
          instagramAccountId: data.instagramAccountId,
          name: data.name,
          flowType: data.flowType,
          dmTemplate: data.dmTemplate,
          status: data.status,
          postId: data.postId !== undefined ? data.postId : undefined,
          postUrl: data.postUrl !== undefined ? data.postUrl : undefined,
          postType: data.postType !== undefined ? data.postType : undefined,
          collectLeads: data.collectLeads,
          leadFields: data.leadFields,
          landingPageToken: data.landingPageToken !== undefined ? data.landingPageToken : undefined,
          alsoReplyComment: data.alsoReplyComment,
          commentReplyText: data.commentReplyText !== undefined ? data.commentReplyText : undefined,
          scheduledActivateAt: data.scheduledActivateAt !== undefined
            ? (data.scheduledActivateAt ? new Date(data.scheduledActivateAt) : null)
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(automations.id, id))
        .returning();

      // 4. Update keywords if provided (replaces old set completely)
      if (data.keywords) {
        await tx.delete(automationKeywords).where(eq(automationKeywords.automationId, id));
        if (data.keywords.length > 0) {
          await tx.insert(automationKeywords).values(
            data.keywords.map((k) => ({
              automationId: id,
              keyword: k.keyword.trim(),
              matchType: k.matchType || 'exact',
            }))
          );
        }
      }

      // 5. Retrieve final keyword set
      const updatedKeywords = await tx
        .select({
          id: automationKeywords.id,
          keyword: automationKeywords.keyword,
          matchType: automationKeywords.matchType,
        })
        .from(automationKeywords)
        .where(eq(automationKeywords.automationId, id));

      return {
        ...updatedAutomation,
        keywords: updatedKeywords,
      };
    });
  }

  /**
   * Delete an automation campaign.
   */
  static async deleteAutomation(userId: string, id: string) {
    // 1. Verify existence & ownership
    const [existing] = await db
      .select({
        id: automations.id,
      })
      .from(automations)
      .innerJoin(
        instagramAccounts,
        eq(automations.instagramAccountId, instagramAccounts.id)
      )
      .where(
        and(
          eq(automations.id, id),
          eq(instagramAccounts.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    // 2. Delete automation (foreign key constraint with onDelete: cascade handles keywords)
    const [deleted] = await db
      .delete(automations)
      .where(eq(automations.id, id))
      .returning();

    return deleted;
  }
}
