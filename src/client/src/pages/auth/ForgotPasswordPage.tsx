import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiError } from '@/lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const forgotPassword = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword.mutate(email, {
      onSuccess: () => setSubmitted(true),
    });
  };

  const error = forgotPassword.error as ApiError | null;

  if (submitted) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We sent a password reset link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success">
            <AlertDescription>
              If an account exists with this email, you will receive a password reset link shortly.
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Forgot password</CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we'll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={forgotPassword.isPending}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={forgotPassword.isPending}
          >
            {forgotPassword.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sending...
              </>
            ) : (
              'Send reset link'
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
