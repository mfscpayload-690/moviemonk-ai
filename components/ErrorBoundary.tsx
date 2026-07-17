import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
          <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border border-white/5 max-w-md w-full text-center relative overflow-hidden shadow-2xl">
            {/* Subtle glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
            <p className="text-sm text-brand-text-light mb-6">
              An unexpected rendering issue occurred on this page. You can try refreshing the section or heading back home.
            </p>

            {this.state.error && (
              <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-left mb-6 overflow-x-auto max-h-24">
                <code className="text-[10px] text-red-300 font-mono break-all whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-brand-text-light hover:text-white font-semibold text-sm transition-all duration-200"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
