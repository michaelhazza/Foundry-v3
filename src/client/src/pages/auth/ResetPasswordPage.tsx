import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useResetPassword } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiError } from '@/lib/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const resetPassword = useResetPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    resetPassword.mutate({ token, password });
  };

  const error = resetPassword.error as ApiError | null;

  if (!token) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Invalid link</CardTitle>
          <CardDescription className="text-center">
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link to="/forgot-password">
            <Button>Request a new link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Reset password</CardTitle>
        <CardDescription className="text-center">
          Enter your new password below
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
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={resetPassword.isPending}
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
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={resetPassword.isPending}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Resetting...
              </>
            ) : (
              'Reset password'
            )}
          </Button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Back to login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
