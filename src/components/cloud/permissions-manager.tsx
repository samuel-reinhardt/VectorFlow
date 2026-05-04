import { useState, useEffect } from 'react';
import { Users, Globe, Lock, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';

interface PermissionsManagerProps {
  cloudProjectId: string;
}

export function PermissionsManager({ cloudProjectId }: PermissionsManagerProps) {
  const { permissions, isLoading, fetchPermissions, updatePermissions } = usePermissions(cloudProjectId);
  const [newType, setNewType] = useState<'email' | 'domain' | 'public'>('email');
  const [newValue, setNewValue] = useState('');
  const [newLevel, setNewLevel] = useState<'read' | 'edit'>('read');
  const { toast } = useToast();

  useEffect(() => {
    if (cloudProjectId) {
      fetchPermissions();
    }
  }, [cloudProjectId, fetchPermissions]);

  const handleAddPermission = async () => {
    if (newType !== 'public' && !newValue.trim()) return;
    const val = newType === 'public' ? '*' : newValue.trim();
    const existing = permissions.find(p => p.entityType === newType && p.entityValue === val);
    if (existing) return;

    const newList = [...permissions, { entityType: newType, entityValue: val, permissionLevel: newLevel }];
    await updatePermissions(newList);
    setNewValue('');
  };

  const handleRemovePermission = async (type: string, value: string) => {
    const newList = permissions.filter(p => !(p.entityType === type && p.entityValue === value));
    await updatePermissions(newList);
  };

  const handleChangePermissionLevel = async (type: string, value: string, level: 'read' | 'edit') => {
    const newList = permissions.map(p => {
      if (p.entityType === type && p.entityValue === value) {
        return { ...p, permissionLevel: level };
      }
      return p;
    });
    await updatePermissions(newList);
  };

  const handleShareLink = () => {
    if (!cloudProjectId) return;
    const url = `${window.location.origin}${window.location.pathname}?projectId=${cloudProjectId}`;
    navigator.clipboard.writeText(url);
    toast({
        title: "Link Copied",
        description: "Share link has been copied to your clipboard.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Share Link */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          <div>
            <div className="text-xs font-semibold">Share Link</div>
            <div className="text-[10px] text-muted-foreground">Copy a direct link to this project</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={handleShareLink}>
          <Copy className="w-3 h-3 mr-1.5" />
          Copy Link
        </Button>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold">Access Permissions</h4>
      {/* Add new permission */}
      <div className="flex flex-col gap-2 p-2 rounded-lg border bg-muted/20">
        <div className="flex gap-2">
          <select 
            className="text-xs border rounded px-1 py-1 bg-background"
            value={newType}
            onChange={(e) => setNewType(e.target.value as any)}
          >
            <option value="email">Email</option>
            <option value="domain">Domain</option>
            <option value="public">Public</option>
          </select>
          {newType !== 'public' && (
            <input 
              type="text" 
              placeholder={newType === 'email' ? 'user@example.com' : 'example.com'} 
              className="flex-1 text-xs border rounded px-2 py-1 bg-background"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          )}
          <select 
            className="text-xs border rounded px-1 py-1 bg-background"
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value as any)}
          >
            <option value="read">Read</option>
            <option value="edit">Edit</option>
          </select>
          <Button size="sm" variant="default" className="h-6 px-2 text-[10px]" onClick={handleAddPermission}>
            Add
          </Button>
        </div>
      </div>

      {/* List active permissions */}
      {isLoading ? (
        <div className="text-[10px] text-muted-foreground text-center py-2">Loading...</div>
      ) : permissions.length === 0 ? (
        <div className="text-[10px] text-muted-foreground text-center py-2 italic">
          Only you have access.
        </div>
      ) : (
        <div className="space-y-1 mt-2">
          {permissions.map((p) => (
            <div key={`${p.entityType}-${p.entityValue}`} className="flex items-center justify-between p-1.5 rounded bg-muted/30 border border-transparent hover:border-border group">
              <div className="flex items-center gap-2 overflow-hidden">
                {p.entityType === 'public' ? (
                  <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                ) : p.entityType === 'domain' ? (
                  <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                ) : (
                  <Users className="w-3 h-3 text-green-500 shrink-0" />
                )}
                <span className="text-[10px] font-medium truncate">
                  {p.entityType === 'public' ? 'Anyone with link' : p.entityValue}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <select 
                  className="text-[10px] bg-transparent border-none focus:ring-0 cursor-pointer hover:bg-muted p-0.5 rounded"
                  value={p.permissionLevel}
                  onChange={(e) => handleChangePermissionLevel(p.entityType, p.entityValue, e.target.value as any)}
                >
                  <option value="read">Can Read</option>
                  <option value="edit">Can Edit</option>
                </select>
                <button 
                  className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  onClick={() => handleRemovePermission(p.entityType, p.entityValue)}
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
