import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  audit,
  users,
  reports,
  subscriptions,
  messages,
  support,
  notifications,
} from '@/lib/db';
import { prisma } from '@/lib/prisma';

const WORKING_LOG_SOURCES = ['admin', 'client', 'system', 'auth', 'doctore', 'enterprise'] as const;

type WorkingLogRecord = {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  source: (typeof WORKING_LOG_SOURCES)[number];
  metadata: {
    sourceFile: string;
    fileBased: true;
  };
};

function isSupportedLevel(value: string): value is WorkingLogRecord['level'] {
  return ['DEBUG', 'INFO', 'WARNING', 'ERROR'].includes(value);
}

async function readWorkingLogsFromFiles(): Promise<WorkingLogRecord[]> {
  try {
    const rootLogPath = path.join(process.cwd(), 'log');
    const logCollections = await Promise.all(
      WORKING_LOG_SOURCES.map(async (source) => {
        const sourceFile = path.join(rootLogPath, source, 'working.log');

        try {
          const content = await fs.readFile(sourceFile, 'utf8');
          const lines = content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

          return lines.map((line, idx) => {
            const [rawTimestamp = '', rawLevel = '', ...rawMessage] = line.split('|').map((part) => part.trim());
            const parsedDate = rawTimestamp ? new Date(rawTimestamp) : new Date();
            const levelCandidate = rawLevel.toUpperCase();

            return {
              id: `${source}-${idx + 1}-${parsedDate.getTime()}`,
              timestamp: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
              level: isSupportedLevel(levelCandidate) ? levelCandidate : 'INFO',
              message: rawMessage.join(' | ') || line,
              source,
              metadata: {
                sourceFile,
                fileBased: true as const,
              },
            };
          });
        } catch {
          // Silent fail for individual source files
          return [];
        }
      })
    );

    return logCollections
      .flat()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error('Error reading working logs:', err);
    return [];
  }
}

function runPythonAnalysis(filePath: string, reportId?: string): Promise<string> {
  // Prefer a remote analysis service when configured (required on Vercel)
  const analysisServiceUrl = process.env.ANALYSIS_SERVICE_URL;

  const isRemoteUrl = (v: string) => /^https?:\/\//i.test(v);

  if (analysisServiceUrl) {
    // Send the file reference to the remote analysis service which can handle
    // either a public URL or a local path (if the service has access).
    return fetch(analysisServiceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl: isRemoteUrl(filePath) ? filePath : undefined, localPath: isRemoteUrl(filePath) ? undefined : filePath, reportId }),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Analysis service responded with ${res.status}`);
      return res.text();
    });
  }

  if (process.env.VERCEL === '1') {
    return Promise.reject(
      new Error('Report analysis requires ANALYSIS_SERVICE_URL when running on Vercel.')
    );
  }

  // Local fallback (development) - must be a local path
  if (isRemoteUrl(filePath)) {
    return Promise.reject(new Error('Cannot analyze remote URL without ANALYSIS_SERVICE_URL configured.'));
  }

  const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
  const scriptPath = path.join(process.cwd(), 'model', 'app.py');
  const args = reportId
    ? [scriptPath, 'analyze-report', '--file', filePath, '--report-id', reportId]
    : [scriptPath, 'analyze-report', '--file', filePath];

  return new Promise((resolve, reject) => {
    const child = spawn(pythonExecutable, args, {
      cwd: process.cwd(),
      env: process.env,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python analysis failed with exit code ${code}`));
        return;
      }

      resolve(stdout.trim());
    });
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation');
  const userId = searchParams.get('userId');

  try {
    switch (operation) {
      case 'activities':
        return NextResponse.json(await audit.listAllActivities(100), { status: 200 });

      case 'logs': {
        try {
          const [dbLogs, fileLogs] = await Promise.all([
            audit.listAllLogs(200),
            readWorkingLogsFromFiles(),
          ]);

          const normalizedDbLogs = (dbLogs.data || []).map((log: Record<string, unknown>) => ({
            id: String(log.id),
            timestamp: String(log.createdAt || log.created_at || log.created || new Date().toISOString()),
            level: String(log.logType || log.level || 'INFO').toUpperCase(),
            message: String(log.message || log.description || ''),
            source: 'system',
            metadata: log.metadata || {},
          }));

          return NextResponse.json(
            [...fileLogs, ...normalizedDbLogs].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ),
            { status: 200 }
          );
        } catch (err) {
          console.error('Error fetching logs:', err);
          return NextResponse.json([], { status: 200 });
        }
      }

      case 'users':
        return NextResponse.json(await users.list(100), { status: 200 });

      case 'reports':
        return NextResponse.json(await reports.listAll(100), { status: 200 });

      case 'subscriptions':
        return NextResponse.json(await subscriptions.listPlans(100), { status: 200 });

      case 'notifications':
        if (userId) {
          return NextResponse.json(await notifications.getAllForUser(userId), { status: 200 });
        }
        return NextResponse.json(await notifications.listAll(50), { status: 200 });

      case 'support':
        return NextResponse.json(await support.list(100), { status: 200 });

      case 'messages':
        return NextResponse.json(await messages.list(100), { status: 200 });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Available: activities, logs, users, reports, subscriptions, notifications, support, messages' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Admin API Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation');
  const id = searchParams.get('id');
  const body = await request.json();

  try {
    switch (operation) {
      case 'activity':
        return NextResponse.json(await audit.logActivity(body), { status: 201 });

      case 'log':
        return NextResponse.json(await audit.createLog(body), { status: 201 });

      case 'subscription-plan':
        return NextResponse.json(await subscriptions.createPlan(body), { status: 201 });

      case 'notification':
        return NextResponse.json(await notifications.create(body), { status: 201 });

      case 'message':
        return NextResponse.json(await messages.create(body), { status: 201 });

      case 'analyze-report': {
        const reportId = body.report_id || id;

        if (!reportId) {
          return NextResponse.json(
            { error: 'report_id or id is required' },
            { status: 400 }
          );
        }

        const reportRecord = await reports.getById(reportId);

        if (!reportRecord.data) {
          return NextResponse.json(
            { error: 'Report not found' },
            { status: 404 }
          );
        }

        const reportUrl = (reportRecord.data as { reportUrl?: string | null }).reportUrl || null;

        if (!reportUrl) {
          return NextResponse.json(
            { error: 'Report file path is missing' },
            { status: 400 }
          );
        }

        const isRemote = /^https?:\/\//i.test(reportUrl);
        let resolvedPath = reportUrl;

        if (!isRemote) {
          resolvedPath = path.join(process.cwd(), 'public', reportUrl.replace(/^\//, ''));

          try {
            await fs.access(resolvedPath);
          } catch {
            return NextResponse.json(
              { error: `Report file not found at ${reportUrl}` },
              { status: 404 }
            );
          }
        }

        try {
          const analysisOutput = await runPythonAnalysis(resolvedPath, reportId);

          let parsedOutput: { analysis?: string } | null = null;
          try {
            parsedOutput = JSON.parse(analysisOutput);
          } catch {
            parsedOutput = null;
          }

          const analysisText = parsedOutput?.analysis || analysisOutput;

          // Save the analysis to DB using Prisma instead of relying on Python worker
          const finalAnalysis = typeof analysisText === 'object' ? JSON.stringify(analysisText) : analysisText;
          await reports.saveAnalysis(reportId, finalAnalysis);
          
          await prisma.uploadedReport.updateMany({
            where: { reportId },
            data: { analyzedByAi: true }
          });

          // Return the analysis text
          return NextResponse.json(
            {
              data: {
                reportId,
                analyzedReport: analysisText,
              },
            },
            { status: 200 }
          );
        } catch (analysisError) {
          console.error('Python analysis error:', analysisError);
          return NextResponse.json(
            { error: `Failed to analyze report: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}` },
            { status: 500 }
          );
        }
      }

      case 'support':
        if (!id) {
          return NextResponse.json(
            { error: 'ID parameter is required for support reply' },
            { status: 400 }
          );
        }
        return NextResponse.json(await support.reply(id, body.reply, body.status), { status: 200 });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Available: activity, log, subscription-plan, notification, analyze-report, support' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Admin API Error:', err);
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
      case 'user':
        return NextResponse.json(await users.update(id, body), { status: 200 });

      case 'report':
        return NextResponse.json(await reports.updateStatus(id, body.status), { status: 200 });

      case 'subscription-plan':
        return NextResponse.json(await subscriptions.updatePlan(id, body), { status: 200 });

      case 'mark-all-notifications-read':
        return NextResponse.json(await notifications.markAllAsRead(id), { status: 200 });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Available: user, report, subscription-plan, mark-all-notifications-read' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Admin API Error:', err);
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

  if (!id) {
    return NextResponse.json(
      { error: 'ID parameter is required' },
      { status: 400 }
    );
  }

  try {
    switch (operation) {
      case 'user':
        return NextResponse.json(await users.delete(id), { status: 200 });

      case 'message':
        return NextResponse.json(await messages.delete(id), { status: 200 });

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Available: user, message' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Admin API Error:', err);
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    );
  }
}

