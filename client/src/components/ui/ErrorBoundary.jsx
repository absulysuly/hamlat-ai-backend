import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * Error Boundary Component
 * From Iraq Compass
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-dark via-dark-200 to-dark flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-glass shadow-glass-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-danger/20 rounded-full">
                <AlertTriangle size={48} className="text-danger" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Oops! Something went wrong
            </h1>
            
            <p className="text-white/70 mb-6">
              We're sorry for the inconvenience. The application has encountered an unexpected error.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-white/50 text-sm mb-2">
                  Error details
                </summary>
                <pre className="bg-dark/50 rounded-lg p-4 text-xs text-white/70 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={this.handleReset}>
                Go to Home
              </Button>
              <Button variant="glass" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
