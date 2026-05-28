import React, { ErrorInfo, ReactNode } from 'react';

import { AppButton } from '../ui/AppButton';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="bg-background flex h-full w-full flex-col items-center justify-center p-8 text-center">
          <div className="flex max-w-md flex-col items-center space-y-4">
            <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground text-center text-sm break-words">
              {this.state.error?.message || 'An unexpected error occurred in the UI.'}
            </p>
            <AppButton onClick={() => this.setState({ hasError: false })}>Try again</AppButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
