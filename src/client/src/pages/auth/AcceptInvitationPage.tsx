import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useValidateInvitation, useAcceptInvitation } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api';

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const { data: invitation, isLoading, error: validateError } = useValidateInvitation(token);
  const acceptInvitation = useAcceptInvitation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (name.trim().length < 2) {
      setValidationError('Name must be at least 2 characters long');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    acceptInvitation.mutate({ token, name: name.trim(), password });
  };

  const error = acceptInvitation.error as ApiError | null;

  if (!token) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Invalid link</CardTitle>
          <CardDescription className="text-center">
            This invitation link is invalid
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Please contact your organization administrator for a new invitation.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (validateError) {
    const apiError = validateError as ApiError;
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {apiError.code === 'INVITATION_EXPIRED' ? 'Invitation expired' : 'Invalid invitation'}
          </CardTitle>
          <CardDescription className="text-center">
            {apiError.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Please contact your organization administrator for a new invitation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Join {invitation?.organizationName}</CardTitle>
        <CardDescription className="text-center">
          You've been invited to join as a {invitation?.role}. Create your account to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || validationError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {validationError || error?.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={invitation?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              disabled={acceptInvitation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={acceptInvitation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={acceptInvitation.isPending}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={acceptInvitation.isPending}
          >
            {acceptInvitation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
