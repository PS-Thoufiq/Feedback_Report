
/* ErrorBoundary.jsx */
import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error in Evaluation Report</h2>
          <p className="text-gray-700">An error occurred: {this.state.error?.message || 'Unknown error'}</p>
          <p className="text-gray-700">Please try uploading the feedback PDF again or contact support.</p>
          <a
            href="https://react.dev/link/error-boundaries"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more about error boundaries
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;