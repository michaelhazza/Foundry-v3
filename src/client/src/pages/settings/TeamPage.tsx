import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import type { ApiResponse } from '@shared/types';
import { PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

export function TeamPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [removeUserId, setRemoveUserId] = useState<number | null>(null);

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>('/users');
      return response.data;
    },
  });

  // Fetch invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: queryKeys.invitations.lists(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>('/invitations');
      return response.data;
    },
  });

  // Send invitation
  const sendInvitation = useMutation({
    mutationFn: async (data: { email: string; role: 'admin' | 'member' }) => {
      const response = await api.post<ApiResponse<any>>('/invitations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.lists() });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      toast.success('Invitation sent');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  // Cancel invitation
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: number) => {
      await api.delete(`/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.lists() });
      toast.success('Invitation cancelled');
    },
  });

  // Remove user
  const removeUser = useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      setRemoveUserId(null);
      toast.success('User removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove user');
    },
  });

  // Change role
  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: 'admin' | 'member' }) => {
      const response = await api.patch<ApiResponse<any>>(`/users/${userId}/role`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('Role updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update role');
    },
  });

  const isAdmin = user?.role === 'admin';
  const pendingInvitations = invitations?.filter((i: any) => i.status === 'pending') || [];

  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage your team members and invitations"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Team' }]}
        actions={
          isAdmin && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Invite member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite team member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to add a new member to your team.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(v: 'admin' | 'member') => setInviteRole(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => sendInvitation.mutate({ email: inviteEmail, role: inviteRole })}
                    disabled={!inviteEmail || sendInvitation.isPending}
                  >
                    {sendInvitation.isPending ? 'Sending...' : 'Send invitation'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="space-y-6">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Active members in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !users || users.length === 0 ? (
              <EmptyState title="No team members" description="Invite members to get started" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.name}
                              {member.id === user?.id && (
                                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRelativeTime(member.createdAt)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {member.id !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    changeRole.mutate({
                                      userId: member.id,
                                      role: member.role === 'admin' ? 'member' : 'admin',
                                    })
                                  }
                                >
                                  Make {member.role === 'admin' ? 'member' : 'admin'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setRemoveUserId(member.id)}
                                >
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {isAdmin && pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Invitations waiting to be accepted</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation: any) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{invitation.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRelativeTime(invitation.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRelativeTime(invitation.expiresAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelInvitation.mutate(invitation.id)}
                          disabled={cancelInvitation.isPending}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Remove User Dialog */}
      <Dialog open={!!removeUserId} onOpenChange={() => setRemoveUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove team member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this team member? They will lose access to all projects and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveUserId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removeUserId && removeUser.mutate(removeUserId)}
              disabled={removeUser.isPending}
            >
              {removeUser.isPending ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
