'use client';

import { Component, type ReactNode } from 'react';

interface TabErrorBoundaryProps {
  children: ReactNode;
}

interface TabErrorBoundaryState {
  hasError: boolean;
}

export default class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  state: TabErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: TabErrorBoundaryProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          This view could not be displayed. Try Refresh or pick another tab.
        </div>
      );
    }

    return this.props.children;
  }
}
