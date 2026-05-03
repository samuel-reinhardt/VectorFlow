import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';
import {
  listDiscoverableProjects,
  getDiscoverableProject,
  updateDiscovery,
} from '@/lib/db';

export const runtime = 'edge';

/** Returns true if `domain` is a valid plain domain string (e.g. "bytes.co"). */
function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$/.test(domain);
}

// ---------------------------------------------------------------------------
// GET /api/discovery
// Lists all projects discoverable to the calling user.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  // Single-project fetch (for non-owners reading a shared project)
  if (projectId) {
    try {
      const project = await getDiscoverableProject(projectId, user.email);
      if (!project) {
        return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 });
      }
      return NextResponse.json({ project });
    } catch (err: any) {
      console.error('[/api/discovery GET single]', err);
      return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
  }

  // List all discoverable projects visible to this caller
  try {
    const projects = await listDiscoverableProjects(user.email);
    return NextResponse.json({ projects });
  } catch (err: any) {
    console.error('[/api/discovery GET list]', err);
    return NextResponse.json({ error: 'Failed to list discoverable projects' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/discovery
// Updates the discovery settings for a project the caller owns.
// Body: { projectId: string; isDiscoverable: boolean; domainRestriction?: string | null }
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    projectId?: string;
    isDiscoverable?: boolean;
    domainRestriction?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { projectId, isDiscoverable, domainRestriction } = body;

  if (!projectId || typeof isDiscoverable !== 'boolean') {
    return NextResponse.json(
      { error: 'Missing required fields: projectId, isDiscoverable' },
      { status: 400 },
    );
  }

  if (domainRestriction != null && domainRestriction !== '') {
    if (typeof domainRestriction !== 'string' || !isValidDomain(domainRestriction)) {
      return NextResponse.json(
        { error: 'Invalid domain restriction. Use a plain domain like "bytes.co".' },
        { status: 400 },
      );
    }
  }

  try {
    const project = await updateDiscovery(
      projectId,
      user.userId,
      isDiscoverable,
      domainRestriction || null,
    );

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission to update it.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ project });
  } catch (err: any) {
    console.error('[/api/discovery PUT]', err);
    return NextResponse.json({ error: 'Failed to update discovery settings' }, { status: 500 });
  }
}
