/**
 * API Client Utility
 * Safe to use in client components - makes HTTP calls to API routes
 */

type ApiEnvelope<T> = {
  data?: T;
  error?: string;
};

type JsonPayload = Record<string, unknown>;

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return typeof value === 'object' && value !== null && 'data' in value;
}

export const apiClient = {
  async uploadProfileImage(file: File, filenameBase: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filenameBase', filenameBase);

    const res = await fetch('/api/upload-profile-image', {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to upload profile image');
    return apiClient.unwrapResponse<{ path: string }>(result);
  },

  async uploadReport(file: File, filenameBase: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filenameBase', filenameBase);

    const res = await fetch('/api/upload-report', {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to upload report');
    return apiClient.unwrapResponse<{ path: string }>(result);
  },

  async uploadSupport(file: File, filenameBase: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filenameBase', filenameBase);

    const res = await fetch('/api/upload-support', {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to upload support file');
    return apiClient.unwrapResponse<{ path: string }>(result);
  },

  unwrapResponse<T>(result: unknown): T | undefined {
    if (isApiEnvelope<T>(result)) {
      const data = result.data;
      if (isApiEnvelope<T>(data)) {
        return data.data;
      }
      return data;
    }

    return result as T;
  },

  // Admin API calls
  admin: {
    async getActivities() {
      const res = await fetch('/api/admin?operation=activities');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch activities');
      return apiClient.unwrapResponse(result) || [];
    },

    async createActivity(payload: JsonPayload) {
      const res = await fetch('/api/admin?operation=activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create activity');
      return apiClient.unwrapResponse(result);
    },

    async getLogs() {
      const res = await fetch('/api/admin?operation=logs');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch logs');
      return apiClient.unwrapResponse(result) || [];
    },

    async createLog(payload: JsonPayload) {
      const res = await fetch('/api/admin?operation=log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create log');
      return apiClient.unwrapResponse(result);
    },

    async getUsers() {
      const res = await fetch('/api/admin?operation=users');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch users');
      return apiClient.unwrapResponse(result) || [];
    },

    async updateUser(userId: string, payload: JsonPayload) {
      const res = await fetch(`/api/admin?operation=user&id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update user');
      return apiClient.unwrapResponse(result);
    },

    async deleteUser(userId: string) {
      const res = await fetch(`/api/admin?operation=user&id=${userId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete user');
      return apiClient.unwrapResponse(result);
    },

    async getReports() {
      const res = await fetch('/api/admin?operation=reports');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch reports');
      return apiClient.unwrapResponse(result) || [];
    },

    async updateReportStatus(reportId: string, status: string) {
      const res = await fetch(`/api/admin?operation=report&id=${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update report');
      return apiClient.unwrapResponse(result);
    },

    async analyzeReport(reportId: string) {
      const res = await fetch(`/api/admin?operation=analyze-report&id=${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to analyze report');
      return apiClient.unwrapResponse(result);
    },

    async getSubscriptions() {
      const res = await fetch('/api/admin?operation=subscriptions');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch subscriptions');
      return apiClient.unwrapResponse(result) || [];
    },

    async createSubscriptionPlan(payload: JsonPayload) {
      const res = await fetch('/api/admin?operation=subscription-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create plan');
      return apiClient.unwrapResponse(result);
    },

    async updateSubscriptionPlan(planId: string, payload: JsonPayload) {
      const res = await fetch(`/api/admin?operation=subscription-plan&id=${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update plan');
      return apiClient.unwrapResponse(result);
    },

    async getNotifications(userId?: string) {
      const query = userId
        ? `/api/admin?operation=notifications&userId=${userId}`
        : '/api/admin?operation=notifications';
      const res = await fetch(query);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch notifications');
      return apiClient.unwrapResponse(result) || [];
    },

    async createNotification(payload: JsonPayload) {
      const res = await fetch('/api/admin?operation=notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create notification');
      return apiClient.unwrapResponse(result);
    },

    async markAllNotificationsAsRead(userId: string) {
      const res = await fetch(`/api/admin?operation=mark-all-notifications-read&id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to mark notifications as read');
      return apiClient.unwrapResponse(result);
    },

    async getSupport() {
      const res = await fetch('/api/admin?operation=support');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch support');
      return apiClient.unwrapResponse(result) || [];
    },

    async updateSupportTicket(ticketId: string, payload: JsonPayload) {
      const res = await fetch(`/api/admin?operation=support&id=${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update support ticket');
      return apiClient.unwrapResponse(result);
    },

    async getMessages() {
      const res = await fetch('/api/admin?operation=messages');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch messages');
      return apiClient.unwrapResponse(result) || [];
    },

    async deleteMessage(messageId: string) {
      const res = await fetch(`/api/admin?operation=message&id=${messageId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete message');
      return apiClient.unwrapResponse(result);
    },

    async createMessage(payload: JsonPayload) {
      const res = await fetch('/api/admin?operation=message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create message');
      return apiClient.unwrapResponse(result);
    },
  },

  // Client API calls
  client: {
    async getProfile(userId: string) {
      const res = await fetch(`/api/client?operation=profile&userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch profile');
      return apiClient.unwrapResponse(result);
    },

    async updateProfile(userId: string, payload: JsonPayload) {
      const res = await fetch(`/api/client?operation=profile&id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update profile');
      return apiClient.unwrapResponse(result);
    },

    async getReports(userId: string) {
      const res = await fetch(`/api/client?operation=reports&userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch reports');
      return apiClient.unwrapResponse(result) || [];
    },

    async getReportById(reportId: string, userId: string) {
      const res = await fetch(`/api/client?operation=report&id=${reportId}&userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch report');
      return apiClient.unwrapResponse(result);
    },

    async createReport(payload: JsonPayload) {
      const res = await fetch('/api/client?operation=report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create report');
      return apiClient.unwrapResponse(result);
    },

    async deleteReport(reportId: string, userId: string) {
      const res = await fetch(`/api/client?operation=report&id=${reportId}&userId=${userId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete report');
      return apiClient.unwrapResponse(result);
    },

    async createUploadedReport(payload: JsonPayload) {
      const res = await fetch('/api/client?operation=uploaded-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to upload report');
      return apiClient.unwrapResponse(result);
    },

    async getSubscriptions(userId: string) {
      const res = await fetch(`/api/client?operation=subscriptions&userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch subscriptions');
      return apiClient.unwrapResponse(result) || [];
    },

    async getActiveSubscription(userId: string) {
      const res = await fetch(`/api/client?operation=active-subscription&userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch active subscription');
      return apiClient.unwrapResponse(result);
    },

    async updateSubscription(payload: JsonPayload) {
      const res = await fetch('/api/client?operation=subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update subscription');
      return apiClient.unwrapResponse(result);
    },

    async getNotifications(userId: string) {
      const res = await fetch(`/api/client?operation=notifications&userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch notifications');
      return apiClient.unwrapResponse(result) || [];
    },

    async getUnreadNotifications(userId: string) {
      const res = await fetch(`/api/client?operation=unread-notifications&userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch unread');
      return apiClient.unwrapResponse(result) || [];
    },

    async markNotificationsAsRead(userId: string) {
      const res = await fetch(`/api/client?operation=mark-notifications-read&userId=${userId}`, {
        method: 'PATCH',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to mark as read');
      return apiClient.unwrapResponse(result);
    },

    async getTickets(userId: string) {
      const res = await fetch(`/api/client?operation=tickets&userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch tickets');
      return apiClient.unwrapResponse(result) || [];
    },

    async createTicket(payload: JsonPayload) {
      const res = await fetch('/api/client?operation=ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create ticket');
      return apiClient.unwrapResponse(result);
    },

    async getActivities(userId: string) {
      const res = await fetch(`/api/client?operation=activities&userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch activities');
      return apiClient.unwrapResponse(result) || [];
    },

    async createActivity(payload: JsonPayload) {
      const res = await fetch('/api/client?operation=activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create activity');
      return apiClient.unwrapResponse(result);
    },
  },
};


