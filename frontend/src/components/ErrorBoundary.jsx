import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PulseConnect Uncaught Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/50 p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center text-2xl mb-4">⚠️</div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">PulseConnect Interface Encountered an Issue</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">A rendering component ran into an unexpected error:</p>
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-700 dark:text-red-300 font-mono mb-5 break-all">
              {this.state.error?.toString() || 'Unknown Rendering Error'}
            </div>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="w-full py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Reset Cache & Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
