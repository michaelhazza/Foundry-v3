import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold">Foundry</h1>
        <p className="text-sm text-muted-foreground">
          AI Training Data Preparation Platform
        </p>
      </div>

      <div className="w-full max-w-md">
        <Outlet />
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Foundry. All rights reserved.</p>
      </div>
    </div>
  );
}
