import { useState } from 'react';
import { useAuth, useUpdateProfile, useChangePassword } from '@/hooks/useAuth';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export function SettingsPage() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = () => {
    if (!name.trim()) return;
    updateProfile.mutate(
      { name: name.trim() },
      {
        onSuccess: () => toast.success('Profile updated'),
        onError: (error) => toast.error(error.message),
      }
    );
  };

  const handleChangePassword = () => {
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success('Password changed successfully');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />

      <div className="space-y-6 max-w-2xl">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={updateProfile.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={user?.role || ''} disabled className="bg-muted capitalize" />
            </div>

            <div className="space-y-2">
              <Label>Organization</Label>
              <Input
                value={user?.organizationName || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={updateProfile.isPending || !name.trim()}
            >
              {updateProfile.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={changePassword.isPending}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={changePassword.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={changePassword.isPending}
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={
                changePassword.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {changePassword.isPending ? 'Changing...' : 'Change password'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
