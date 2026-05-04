import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';
import { listProjects, createProject } from '@/lib/db';
import type { ExportData } from '@/lib/export-import';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/projects
 * Lists all projects belonging to the authenticated user (metadata only).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projects = await listProjects(user.userId);
    return NextResponse.json({ projects }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err: any) {
    console.error('[/api/projects GET]', err);
    return NextResponse.json({ error: 'Failed to list projects' }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Creates a new project. Body must include the full ExportData payload.
 *
 * Body: { name: string; data: ExportData }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string; data?: ExportData };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, data } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
  }

  if (!data || typeof data !== 'object' || !data.projectId) {
    return NextResponse.json({ error: 'Missing or invalid field: data (must include projectId)' }, { status: 400 });
  }

  try {
    const project = await createProject({
      id: data.projectId,
      userId: user.userId,
      name: name.trim(),
      data,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (err: any) {
    // Unique constraint violation — project with this ID already exists
    if (err?.message?.includes('UNIQUE') || err?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return NextResponse.json(
        { error: 'A project with this ID already exists. Use PUT to update it.' },
        { status: 409 },
      );
    }
    console.error('[/api/projects POST]', err);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
