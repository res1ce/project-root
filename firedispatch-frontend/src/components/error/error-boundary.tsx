'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'react-toastify';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Обновляем состояние, чтобы показать резервный UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Можно залогировать ошибку в сервис логирования
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Отображаем сообщение об ошибке с помощью toast
    if (error.message.includes('AxiosError') || error.message.includes('401')) {
      // Обрабатываем ошибки Axios отдельно
      toast.error('Ошибка авторизации. Пожалуйста, проверьте введенные данные.');
    } else {
      // Общее сообщение об ошибке для остальных случаев
      toast.error('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
    }
  }

  render() {
    if (this.state.hasError) {
      // Отображаем наш fallback UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Что-то пошло не так</h2>
            <p className="text-gray-700 mb-4">
              Мы столкнулись с непредвиденной ошибкой. Пожалуйста, попробуйте обновить страницу.
            </p>
            <div className="bg-gray-100 p-4 rounded-md mb-4 overflow-auto text-sm">
              <code>{this.state.error?.message || 'Неизвестная ошибка'}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 