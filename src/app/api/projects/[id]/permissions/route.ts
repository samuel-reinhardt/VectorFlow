import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';
import { getProjectPermissions, setProjectPermissions, ProjectPermission } from '@/lib/db';

export const runtime = 'edge';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/permissions
 * Returns the permissions for the given project.
 */
export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const permissions = await getProjectPermissions(id);
    return NextResponse.json({ permissions });
  } catch (err: any) {
    console.error('[/api/projects/[id]/permissions GET]', err);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]/permissions
 * Updates permissions for a project. Only the owner can do this.
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { permissions: Omit<ProjectPermission, 'projectId'>[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.permissions)) {
    return NextResponse.json({ error: 'Permissions must be an array' }, { status: 400 });
  }

  try {
    const success = await setProjectPermissions(id, user.userId, body.permissions);
    if (!success) {
      return NextResponse.json({ error: 'Not found or access denied' }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[/api/projects/[id]/permissions PUT]', err);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
