import { NextResponse } from 'next/server';
import {
  audit,
  users,
  reports,
  subscriptions,
  notifications,
  tickets,
} from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation');
  const userId = searchParams.get('userId');
  const id = searchParams.get('id');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId parameter is required' },
      { status: 400 }
    );
  }

  try {
    switch (operation) {
      case 'profile':
        return NextResponse.json(await users.getById(userId), { status: 200 });

      case 'report': {
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required for report' },
            { status: 400 }
          );
        }

        const reportRes = await reports.getById(id);
        if (!reportRes.data) {
          return NextResponse.json(reportRes, { status: 404 });
        }

        if (reportRes.data.userId !== userId) {
          return NextResponse.json(
            { error: 'You are not allowed to access this report' },
            { status: 403 }
          );
        }

        return NextResponse.json(reportRes, { status: 200 });
      }

      case 'reports':
        return NextResponse.json(await reports.listForUser(userId, 100), { status: 200 });

      case 'subscriptions':
        return NextResponse.json(await subscriptions.listPlans(100), { status: 200 });

      case 'active-subscription':
        return NextResponse.json(await subscriptions.getActiveForUser(userId), { status: 200 });

      case 'notifications':
        return NextResponse.json(await notifications.getAllForUser(userId), { status: 200 });

      case 'unread-notifications':
        return NextResponse.json(await notifications.getUnreadForUser(userId), { status: 200 });

      case 'tickets':
        return NextResponse.json(await tickets.listForUser(userId, 50), { status: 200 });

      case 'activities':
        return NextResponse.json(await audit.getActivities(userId, 10), { status: 200 });

      case 'all-subscriptions':
        return NextResponse.json(await subscriptions.listPlans(100), { status: 200 });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Available: profile, report, reports, subscriptions, active-subscription, notifications, unread-notifications, tickets, activities, all-subscriptions' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Client API Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation');
  const body = await request.json();

  try {
    switch (operation) {
      case 'activity':
        return NextResponse.json(await audit.logActivity(body), { status: 201 });

      case 'report':
        const reportRes = await reports.create(body);
        // Auto-create notification for new report
        if (reportRes.data?.id && body.user_id) {
          await notifications.create({
            subject: '📋 New Report Submitted',
            body: 'Your medical report has been submitted for analysis. We will review it shortly.',
            created_by: 'system',
            target_user_ids: [body.user_id]
          });
        }
        return NextResponse.json(reportRes, { status: 201 });

      case 'uploaded-report':
        const uploadRes = await reports.createUploaded(body);
        // Auto-create notification for uploaded report
        if (uploadRes.data?.id && body.user_id) {
          await notifications.create({
            subject: '✅ Report Upload Successful',
            body: 'Your report has been successfully uploaded and is now available for review.',
            created_by: 'system',
            target_user_ids: [body.user_id]
          });
        }
        return NextResponse.json(uploadRes, { status: 201 });

      case 'ticket':
        const ticketRes = await tickets.create(body);
        // Auto-create notification for new support ticket
        if (ticketRes.data?.id && body.user_id) {
          await notifications.create({
            subject: '🎫 Support Ticket Created',
            body: 'Your support ticket has been received. Our team will respond shortly.',
            created_by: 'system',
            target_user_ids: [body.user_id]
          });
        }
        return NextResponse.json(ticketRes, { status: 201 });

      case 'subscription':
        const subRes = await subscriptions.updateUserSubscription(body.user_id, body);
        // Auto-create notification for subscription update
        if (subRes.data?.id && body.user_id) {
          const planName = body.plan_name || 'subscription';
          await notifications.create({
            subject: '🎉 Subscription Updated',
            body: `Your subscription has been updated to ${planName}. Enjoy your benefits!`,
            created_by: 'system',
            target_user_ids: [body.user_id]
          });
        }
        return NextResponse.json(subRes, { status: 201 });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Available: activity, report, uploaded-report, ticket, subscription' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Client API Error:', err);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation');
  const id = searchParams.get('id');
  const body = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: 'ID parameter is required' },
      { status: 400 }
    );
  }

  try {
    switch (operation) {
      case 'profile':
        return NextResponse.json(await users.update(id, body), { status: 200 });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Available: profile' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Client API Error:', err);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation');
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId parameter is required' },
      { status: 400 }
    );
  }

  try {
    switch (operation) {
      case 'mark-notifications-read':
        return NextResponse.json(await notifications.markAllAsRead(userId), { status: 200 });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Available: mark-notifications-read' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Client API Error:', err);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation');
  const id = searchParams.get('id');
  const userId = searchParams.get('userId');

  if (!id) {
    return NextResponse.json(
      { error: 'ID parameter is required' },
      { status: 400 }
    );
  }

  try {
    switch (operation) {
      case 'report': {
        const reportRecord = await reports.getById(id);

        if (!reportRecord.data) {
          return NextResponse.json(
            { error: 'Report not found' },
            { status: 404 }
          );
        }

        if (userId && reportRecord.data.userId !== userId) {
          return NextResponse.json(
            { error: 'You are not allowed to delete this report' },
            { status: 403 }
          );
        }

        return NextResponse.json(await reports.delete(id), { status: 200 });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Available: report' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Client API Error:', err);
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    );
  }
}
