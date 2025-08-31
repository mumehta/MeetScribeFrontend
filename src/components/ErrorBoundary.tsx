import React from 'react'
import { logger } from '../lib/logger'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = { hasError: boolean; error?: any }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    logger.error('React render error', { error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: 16 }}>
          <h3>Something went wrong.</h3>
          <p>Please refresh the page. If the problem persists, contact support.</p>
        </div>
      )
    }
    return this.props.children
  }
}
