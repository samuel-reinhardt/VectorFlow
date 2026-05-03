import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';
import { getProject, updateProject, deleteProject } from '@/lib/db';
import type { ExportData } from '@/lib/export-import';

export const runtime = 'edge';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]
 * Returns the full project (including data blob) for the authenticated owner.
 */
export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const project = await getProject(id, user.userId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (err: any) {
    console.error('[/api/projects/[id] GET]', err);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]
 * Updates a project's data and/or name. Only the owner can update.
 *
 * Body: { name?: string; data?: ExportData }
 * At least one of name or data must be present.
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { name?: string; data?: ExportData };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.name && !body.data) {
    return NextResponse.json(
      { error: 'At least one of name or data must be provided' },
      { status: 400 },
    );
  }

  try {
    const project = await updateProject(id, user.userId, {
      name: body.name,
      data: body.data,
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (err: any) {
    console.error('[/api/projects/[id] PUT]', err);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Deletes a project. Only the owner can delete.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const deleted = await deleteProject(id, user.userId);
    if (!deleted) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[/api/projects/[id] DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
