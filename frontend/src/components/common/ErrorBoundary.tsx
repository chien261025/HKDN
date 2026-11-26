import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SMART-WMS ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Đã xảy ra sự cố hiển thị</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống đã tự động ngăn chặn lỗi trang trắng. Bạn có thể thử tải lại trang hoặc quay về trang chủ.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-100 text-left text-2xs font-mono text-slate-700 overflow-x-auto max-h-32 border border-slate-200">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải lại trang</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

