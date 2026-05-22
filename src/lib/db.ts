import { prisma } from './prisma';
import * as bcrypt from 'bcrypt';
import type { Role } from '@/generated/prisma/enums';
import { deleteUpload } from './upload-storage';

/**
 * Database abstraction layer for MedX application
 * Uses Prisma ORM with PostgreSQL adapter
 */

// ============================================
// AUDIT MODULE - Activities and Logs
// ============================================
export const audit = {
  async logActivity(payload: {
    user_id: string;
    action: string;
    description: string;
    source: 'admin' | 'user' | 'system';
  }) {
    try {
      const activity = await prisma.activity.create({
        data: {
          userId: payload.user_id,
          action: payload.action,
          description: payload.description,
          source: payload.source,
          createdAt: new Date(),
        },
      });
      return { data: activity, error: null };
    } catch (err) {
      console.error('Failed to log activity:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async listAllActivities(limit = 100) {
    try {
      const activities = await prisma.activity.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return { data: activities, error: null };
    } catch (err) {
      console.error('Failed to list activities:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async listAllLogs(limit = 200) {
    try {
      const logs = await prisma.log.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return { data: logs, error: null };
    } catch (err) {
      console.error('Failed to list logs:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async createLog(payload: { user_id: string; log_type: string; message: string }) {
    try {
      const log = await prisma.log.create({
        data: {
          userId: payload.user_id,
          logType: payload.log_type,
          message: payload.message,
          createdAt: new Date(),
        },
      });
      return { data: log, error: null };
    } catch (err) {
      console.error('Failed to create log:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async getActivities(userId: string, limit = 10) {
    try {
      const activities = await prisma.activity.findMany({
        where: { userId: userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return { data: activities, error: null };
    } catch (err) {
      console.error('Failed to get activities:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

// ============================================
// USERS MODULE - User Management
// ============================================
export const users = {
  async getById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      return { data: user, error: null };
    } catch (err) {
      console.error('Failed to get user:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async getByEmail(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return { data: user, error: null };
    } catch (err) {
      console.error('Failed to get user by email:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async list(limit = 100) {
    try {
      const users = await prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return { data: users, error: null };
    } catch (err) {
      console.error('Failed to list users:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async update(userId: string, payload: Record<string, unknown>) {
    try {
      // Build update data with proper field mapping and conditional logic
      const data: Record<string, unknown> = {};

      // Direct field mappings
      if (payload.first_name !== undefined) data.firstName = payload.first_name;
      if (payload.last_name !== undefined) data.lastName = payload.last_name;
      if (payload.username !== undefined) data.username = payload.username;
      if (payload.email !== undefined) data.email = payload.email;
      if (payload.password !== undefined && typeof payload.password === 'string') data.password = await bcrypt.hash(payload.password, 10);
      if (payload.phone_no !== undefined) data.phoneNo = payload.phone_no;
      if (payload.image !== undefined) data.profileImage = payload.image;
      if (payload.role !== undefined) data.role = payload.role;
      if (payload.resetToken !== undefined) data.resetToken = payload.resetToken;
      if (payload.resetTokenExpiry !== undefined) data.resetTokenExpiry = payload.resetTokenExpiry;

      // Address handling: address maps to permanentAddress, and residentialAddress defaults to address if not explicitly provided
      if (payload.address !== undefined) {
        data.permanentAddress = payload.address;
        // Only set residentialAddress to address if it's not explicitly provided
        if (payload.residentialAddress === undefined) {
          data.residentialAddress = payload.address;
        }
      }

      // Explicit field mappings (overrides defaults)
      if (payload.permanentAddress !== undefined) data.permanentAddress = payload.permanentAddress;
      if (payload.residentialAddress !== undefined) data.residentialAddress = payload.residentialAddress;

      const user = await prisma.user.update({
        where: { id: userId },
        data,
      });
      return { data: user, error: null };
    } catch (err) {
      console.error('Failed to update user:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async delete(userId: string) {
    try {
      const user = await prisma.user.delete({
        where: { id: userId },
      });
      return { data: user, error: null };
    } catch (err) {
      console.error('Failed to delete user:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async countByRole(role: string) {
    try {
      const count = await prisma.user.count({
        where: { role: role as Role },
      });
      return { data: count, error: null };
    } catch (err) {
      console.error('Failed to count users:', err);
      return { data: 0, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

// ============================================
// REPORTS MODULE - Medical Reports
// ============================================
export const reports = {
  async create(payload: {
    user_id: string;
    report_status: string;
    upload_date: string;
  }) {
    try {
      const report = await prisma.report.create({
        data: {
          userId: payload.user_id,
          reportStatus: payload.report_status,
          uploadDate: new Date(payload.upload_date),
        },
      });
      return { data: report, error: null };
    } catch (err) {
      console.error('Failed to create report:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async createUploaded(payload: {
    report_id: string;
    report_url: string;
    report_type: string;
    analyzed_by_ai: boolean;
    checked_by_doctor: boolean;
    language: string;
    send_to_whatsapp: boolean;
  }) {
    try {
      const uploaded = await prisma.uploadedReport.create({
        data: {
          reportId: payload.report_id,
          reportUrl: payload.report_url,
          reportType: payload.report_type,
          analyzedByAi: payload.analyzed_by_ai,
          checkedByDoctor: payload.checked_by_doctor,
          language: payload.language,
          sendToWhatsapp: payload.send_to_whatsapp,
        },
      });
      return { data: uploaded, error: null };
    } catch (err) {
      console.error('Failed to create uploaded report:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async listAll(limit = 100) {
    try {
      const [reports, uploadedReports] = await Promise.all([
        prisma.report.findMany({
          take: limit,
          orderBy: { uploadDate: 'desc' },
        }),
        prisma.uploadedReport.findMany({
          take: limit * 2,
        }),
      ]);

      const uploadedByReportId = new Map(
        uploadedReports
          .filter((item) => item.reportId)
          .map((item) => [item.reportId as string, item])
      );

      const normalizedReports = reports.map((report) => {
        const uploaded = uploadedByReportId.get(report.id);

        return {
          ...report,
          reportUrl: uploaded?.reportUrl || null,
          reportType: uploaded?.reportType || null,
          analyzedByAi: uploaded?.analyzedByAi || false,
          checkedByDoctor: uploaded?.checkedByDoctor || false,
          language: uploaded?.language || null,
        };
      });

      return { data: normalizedReports, error: null };
    } catch (err) {
      console.error('Failed to list reports:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async listForUser(userId: string, limit = 100) {
    try {
      const [reports, uploadedReports] = await Promise.all([
        prisma.report.findMany({
          where: { userId: userId },
          take: limit,
          orderBy: { uploadDate: 'desc' },
        }),
        prisma.uploadedReport.findMany({
          take: limit * 2,
        }),
      ]);

      const uploadedByReportId = new Map(
        uploadedReports
          .filter((item) => item.reportId)
          .map((item) => [item.reportId as string, item])
      );

      const normalizedReports = reports.map((report) => {
        const uploaded = uploadedByReportId.get(report.id);

        return {
          ...report,
          reportUrl: uploaded?.reportUrl || null,
          reportType: uploaded?.reportType || null,
          analyzedByAi: uploaded?.analyzedByAi || false,
          checkedByDoctor: uploaded?.checkedByDoctor || false,
          language: uploaded?.language || null,
        };
      });

      return { data: normalizedReports, error: null };
    } catch (err) {
      console.error('Failed to list user reports:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async updateStatus(reportId: string, status: string) {
    try {
      const report = await prisma.report.update({
        where: { id: reportId },
        data: { reportStatus: status },
      });
      return { data: report, error: null };
    } catch (err) {
      console.error('Failed to update report status:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async getById(reportId: string) {
    try {
      const [report, uploadedReport] = await Promise.all([
        prisma.report.findUnique({
          where: { id: reportId },
        }),
        prisma.uploadedReport.findFirst({
          where: { reportId },
        }),
      ]);

      if (!report) {
        return { data: null, error: 'Report not found' };
      }

      return {
        data: {
          ...report,
          reportUrl: uploadedReport?.reportUrl || null,
          reportType: uploadedReport?.reportType || null,
          analyzedByAi: uploadedReport?.analyzedByAi || false,
          checkedByDoctor: uploadedReport?.checkedByDoctor || false,
          language: uploadedReport?.language || null,
        },
        error: null,
      };
    } catch (err) {
      console.error('Failed to get report:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async saveAnalysis(reportId: string, analyzedReport: string) {
    try {
      const report = await prisma.report.update({
        where: { id: reportId },
        data: {
          analyzedReport,
          reportStatus: 'reviewed',
        },
      });
      return { data: report, error: null };
    } catch (err) {
      console.error('Failed to save analysis:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async delete(reportId: string) {
    try {
      const uploadedReport = await prisma.uploadedReport.findFirst({
        where: { reportId },
      });

      if (uploadedReport?.reportUrl) {
        await deleteUpload(uploadedReport.reportUrl);
      }

      await prisma.$transaction([
        prisma.uploadedReport.deleteMany({ where: { reportId } }),
        prisma.report.delete({ where: { id: reportId } }),
      ]);

      return { data: { id: reportId }, error: null };
    } catch (err) {
      console.error('Failed to delete report:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

// ============================================
// SUBSCRIPTIONS MODULE - Plans & Billing
// ============================================
export const subscriptions = {
  async listPlans(limit = 100) {
    try {
      const plans = await prisma.subscription.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return { data: plans, error: null };
    } catch (err) {
      console.error('Failed to list plans:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async getActiveForUser(userId: string) {
    try {
      const userSubscription = await prisma.userSubscription.findFirst({
        where: {
          userId: userId,
          status: 'active',
        },
        orderBy: { startDate: 'desc' },
      });

      if (!userSubscription || !userSubscription.subscriptionId) {
        return { data: null, error: null };
      }

      // Fetch the subscription details
      const subscription = await prisma.subscription.findUnique({
        where: { id: userSubscription.subscriptionId },
      });

      return {
        data: {
          ...userSubscription,
          subscription: subscription,
        },
        error: null,
      };
    } catch (err) {
      console.error('Failed to get active subscription:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async updateUserSubscription(
    userId: string,
    payload: {
      subscription_id: string;
      status: string;
      start_date: string;
      end_date: string | null;
      is_free_plan?: boolean;
    }
  ) {
    try {
      // First, deactivate any existing active subscriptions
      await prisma.userSubscription.updateMany({
        where: { userId: userId, status: 'active' },
        data: { status: 'expired' },
      });

      // Create new subscription
      const subscription = await prisma.userSubscription.create({
        data: {
          userId: userId,
          subscriptionId: payload.subscription_id,
          status: payload.status,
          startDate: new Date(payload.start_date),
          endDate: payload.end_date ? new Date(payload.end_date) : null,
        },
      });
      return { data: subscription, error: null };
    } catch (err) {
      console.error('Failed to update subscription:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async createPlan(payload: {
    plan_name: string;
    monthly_price: number;
    yearly_price: number;
    features: string[] | string;
    monthly_discount?: number;
    yearly_discount?: number;
  }) {
    try {
      const plan = await prisma.subscription.create({
        data: {
          planName: payload.plan_name,
          monthlyPrice: payload.monthly_price,
          yearlyPrice: payload.yearly_price,
          features: typeof payload.features === 'string' ? payload.features : JSON.stringify(payload.features),
          monthlyDiscount: payload.monthly_discount || 0,
          yearlyDiscount: payload.yearly_discount || 0,
          createdAt: new Date(),
        },
      });
      return { data: plan, error: null };
    } catch (err) {
      console.error('Failed to create plan:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async updatePlan(
    planId: string,
    payload: {
      plan_name: string;
      monthly_price: number;
      yearly_price: number;
      features: string[] | string;
      monthly_discount?: number;
      yearly_discount?: number;
    }
  ) {
    try {
      const plan = await prisma.subscription.update({
        where: { id: planId },
        data: {
          planName: payload.plan_name,
          monthlyPrice: payload.monthly_price,
          yearlyPrice: payload.yearly_price,
          features: typeof payload.features === 'string' ? payload.features : JSON.stringify(payload.features),
          monthlyDiscount: payload.monthly_discount || 0,
          yearlyDiscount: payload.yearly_discount || 0,
        },
      });
      return { data: plan, error: null };
    } catch (err) {
      console.error('Failed to update plan:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

// ============================================
// MESSAGES MODULE - Contact Form Messages
// ============================================
export const messages = {
  async list(limit = 100) {
    try {
      const messages = await prisma.message.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return { data: messages, error: null };
    } catch (err) {
      console.error('Failed to list messages:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async delete(messageId: string) {
    try {
      const message = await prisma.message.delete({
        where: { id: messageId },
      });
      return { data: message, error: null };
    } catch (err) {
      console.error('Failed to delete message:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async create(payload: {
    first_name: string;
    last_name: string;
    email: string;
    subject: string;
    body: string;
  }) {
    try {
      const message = await prisma.message.create({
        data: {
          firstName: payload.first_name,
          lastName: payload.last_name,
          email: payload.email,
          subject: payload.subject,
          body: payload.body,
          createdAt: new Date(),
        },
      });
      return { data: message, error: null };
    } catch (err) {
      console.error('Failed to create message:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

// ============================================
// SUPPORT MODULE - Support Tickets
// ============================================
export const support = {
  async list(limit = 100) {
    try {
      const tickets = await prisma.support.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return { data: tickets, error: null };
    } catch (err) {
      console.error('Failed to list support tickets:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async reply(ticketId: string, replyText: string, status = 'replied') {
    try {
      const ticket = await prisma.support.update({
        where: { id: ticketId },
        data: {
          reply: replyText,
          status,
          updatedAt: new Date(),
        },
      });
      return { data: ticket, error: null };
    } catch (err) {
      console.error('Failed to reply to ticket:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async updateStatus(ticketId: string, status: string) {
    try {
      const ticket = await prisma.support.update({
        where: { id: ticketId },
        data: {
          status,
          updatedAt: new Date(),
        },
      });
      return { data: ticket, error: null };
    } catch (err) {
      console.error('Failed to update support status:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

// ============================================
// NOTIFICATIONS MODULE - System Notifications
// ============================================
export const notifications = {
  async create(payload: { subject: string; body: string; created_by: string; target_user_ids?: string[] }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          subject: payload.subject,
          body: payload.body,
          createdBy: payload.created_by,
          createdAt: new Date(),
        },
      });

      // Broadcast notification to users so it appears in user-specific dropdowns/pages.
      const targetUserIds = Array.isArray(payload.target_user_ids) && payload.target_user_ids.length > 0
        ? payload.target_user_ids
        : (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id);

      if (targetUserIds.length > 0) {
        await prisma.userNotification.createMany({
          data: targetUserIds.map((userId) => ({
            userId,
            notificationId: notification.id,
            isRead: false,
          })),
        });
      }

      return { data: notification, error: null };
    } catch (err) {
      console.error('Failed to create notification:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async listAll(limit = 50) {
    try {
      const notifications = await prisma.notification.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return { data: notifications, error: null };
    } catch (err) {
      console.error('Failed to list notifications:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async getAllForUser(userId: string) {
    try {
      const userNotifications = await prisma.userNotification.findMany({
        where: { userId: userId },
        orderBy: { id: 'desc' },
      });

      // Enrich with notification details (subject, body, created_at)
      const enriched = await Promise.all(userNotifications.map(async (n) => {
        const note = n.notificationId ? await prisma.notification.findUnique({ where: { id: n.notificationId } }) : null;
        return {
          id: n.id,
          notification_id: n.notificationId,
          isRead: n.isRead ?? false,
          notifications: {
            subject: note?.subject || null,
            body: note?.body || null,
            created_at: note?.createdAt || null,
          },
        };
      }));

      return { data: enriched, error: null };
    } catch (err) {
      console.error('Failed to get user notifications:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async getUnreadForUser(userId: string) {
    try {
      const unread = await prisma.userNotification.findMany({
        where: { userId: userId, isRead: false },
      });
      return { data: unread, error: null };
    } catch (err) {
      console.error('Failed to get unread notifications:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.userNotification.updateMany({
        where: { userId: userId, isRead: false },
        data: { isRead: true },
      });
      return { data: result, error: null };
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const notification = await prisma.userNotification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return { data: notification, error: null };
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

// ============================================
// TICKETS MODULE - Support Tickets
// ============================================
export const tickets = {
  async create(payload: { user_id: string; subject: string; body: string; status: string; image?: string; image_url?: string }) {
    try {
      const ticket = await prisma.support.create({
        data: {
          userId: payload.user_id,
          subject: payload.subject,
          body: payload.body,
          status: payload.status,
          // optional image fields
          image: payload.image ?? undefined,
          imageUrl: payload.image_url ?? undefined,
          createdAt: new Date(),
        },
      });
      return { data: ticket, error: null };
    } catch (err) {
      console.error('Failed to create ticket:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async listForUser(userId: string, limit = 50) {
    try {
      const tickets = await prisma.support.findMany({
        where: { userId: userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return { data: tickets, error: null };
    } catch (err) {
      console.error('Failed to list user tickets:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

// ============================================
// DB FUNCTIONS - Aliases for compatibility
// ============================================
export const dbAudit = audit;
export const dbUsers = users;
export const dbReports = reports;
export const dbSubscriptions = subscriptions;
export const dbMessages = messages;
export const dbSupport = support;
export const dbNotifications = notifications;
