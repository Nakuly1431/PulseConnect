import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PulseConnect Uncaught Error Boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #fee2e2',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px'
            }}>
              ⚠️
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
              PulseConnect Interface Encountered an Issue
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              A rendering component ran into an unexpected error:
            </p>

            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px',
              color: '#991b1b',
              fontFamily: 'monospace',
              marginBottom: '20px',
              wordBreak: 'break-all'
            }}>
              {this.state.error?.toString() || 'Unknown Rendering Error'}
            </div>

            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '12px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
              }}
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
