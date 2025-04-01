import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-dark-bg-primary flex items-center justify-center p-8">
          <div className="bg-dark-bg-secondary rounded-lg p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold text-dark-error mb-4">Something went wrong</h1>
            <p className="text-dark-text-muted mb-4">
              An error occurred in the application. Please try refreshing the page.
            </p>
            <pre className="bg-dark-bg-tertiary p-4 rounded-lg overflow-auto text-sm text-dark-text-muted">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-dark-accent-primary text-white px-6 py-3 rounded-button font-medium
                       hover:bg-dark-accent-hover transition-all duration-300"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 