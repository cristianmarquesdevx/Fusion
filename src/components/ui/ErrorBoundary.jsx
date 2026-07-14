/** @format */

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retries: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error?.message, error?.stack);
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fusion:error', {
            detail: { error: error?.message, stack: error?.stack, componentStack: errorInfo?.componentStack },
          })
        );
      }
    } catch {
      // Ignora erro ao logar
    }
  }

  handleReset = () => {
    const max = this.props.maxRetries ?? 3;
    if (this.state.retries >= max) {
      window.location.reload();
      return;
    }
    this.setState((prev) => ({ hasError: false, error: null, retries: prev.retries + 1 }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isCritical = this.props.fallback === 'critical';
      const errorMsg = this.state.error?.message || this.state.error?.toString() || 'Erro desconhecido';

      if (isCritical) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-bg-dark p-6">
            <div className="max-w-md w-full text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose/10 dark:bg-rose-dark/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-rose dark:text-rose-dark">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-semibold text-ink dark:text-ink-dark mb-2">
                Algo deu errado
              </h2>
              <p className="text-sm text-ink-soft dark:text-ink-dark-soft mb-6 leading-relaxed">
                Ocorreu um erro inesperado ao carregar esta página.
              </p>
              {/* Mensagem de erro para debug */}
              <div className="mb-6 p-4 rounded-lg bg-surface-2 dark:bg-surface-dark-2 border border-border dark:border-border-dark text-left">
                <p className="text-[11px] font-mono text-ink-faint dark:text-ink-dark-faint break-all leading-relaxed select-all">
                  {errorMsg}
                </p>
                {this.state.error?.stack && (
                  <details className="mt-2">
                    <summary className="text-[10px] text-ink-faint/60 dark:text-ink-dark-faint/60 cursor-pointer hover:text-ink-soft dark:hover:text-ink-dark-soft">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-[10px] font-mono text-ink-faint/50 dark:text-ink-dark-faint/50 break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={this.handleReset}
                  className="px-5 py-2.5 rounded-lg bg-surface-2 dark:bg-surface-dark-2 text-ink dark:text-ink-dark text-sm font-semibold hover:bg-surface-3 dark:hover:bg-surface-dark-3 transition-colors"
                >
                  Tentar novamente ({3 - this.state.retries})
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-5 py-2.5 rounded-lg bg-brand dark:bg-brand-dark text-white text-sm font-semibold hover:bg-brand-hover dark:hover:bg-brand-dark-hover transition-colors"
                >
                  Recarregar página
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Fallback simples para sub-componentes
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-rose/10 dark:bg-rose-dark/10 flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-rose dark:text-rose-dark">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <p className="text-sm font-medium text-ink dark:text-ink-dark mb-1">
            Este componente não pôde ser carregado.
          </p>
          <p className="text-xs text-ink-faint dark:text-ink-dark-faint">
            {this.props.message || 'Tente recarregar a página.'}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-4 text-xs font-semibold text-brand dark:text-brand-dark hover:underline underline-offset-2"
          >
            Tentar novamente ({3 - this.state.retries})
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
