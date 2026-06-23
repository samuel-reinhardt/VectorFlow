import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';
import {
  listDiscoverableProjects,
  getDiscoverableProject,
} from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!user && !projectId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Single-project fetch (for non-owners reading a shared project)
  if (projectId) {
    try {
      const project = await getDiscoverableProject(projectId, user?.email || '');
      if (!project) {
        return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 });
      }
      return NextResponse.json({ project }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
    } catch (err: any) {
      console.error('[/api/discovery GET single]', err);
      return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
  }

  // List all discoverable projects visible to this caller
  try {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const projects = await listDiscoverableProjects(user.email);
    return NextResponse.json({ projects }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err: any) {
    console.error('[/api/discovery GET list]', err);
    return NextResponse.json({ error: 'Failed to list discoverable projects' }, { status: 500 });
  }
}
