'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { DatePickerInput } from '@mantine/dates';

interface Report {
  id: number;
  title: string;
  type: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  userId: number;
  fileUrl?: string;
  parameters?: Record<string, any>;
}

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Фильтры
  const [reportType, setReportType] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        // В реальном приложении здесь был бы запрос к API
        // const response = await api.get('/report');
        
        // Демонстрационные данные
        const mockReports: Report[] = [
          {
            id: 1,
            title: 'Отчет по активным пожарам',
            type: 'active_fires',
            createdAt: '2025-04-28T10:30:00Z',
            userId: user?.id || 1,
            fileUrl: '#'
          },
          {
            id: 2,
            title: 'Статистика пожаров за апрель 2025',
            type: 'monthly_statistics',
            createdAt: '2025-04-25T15:20:00Z',
            startDate: '2025-04-01',
            endDate: '2025-04-30',
            userId: user?.id || 1,
            fileUrl: '#'
          },
          {
            id: 3,
            title: 'Отчет по работе пожарных частей',
            type: 'stations_performance',
            createdAt: '2025-04-20T09:15:00Z',
            startDate: '2025-03-01',
            endDate: '2025-03-31',
            userId: user?.id || 1,
            fileUrl: '#'
          }
        ];
        
        setReports(mockReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('Ошибка при загрузке отчетов');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [user?.id]);
  
  const handleGenerateReport = async (type: string) => {
    if (!startDate && (type === 'monthly_statistics' || type === 'stations_performance')) {
      toast.error('Выберите начальную дату для отчета');
      return;
    }
    
    if (!endDate && (type === 'monthly_statistics' || type === 'stations_performance')) {
      toast.error('Выберите конечную дату для отчета');
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // В реальном приложении здесь был бы запрос к API
      // const response = await api.post('/report', {
      //   type,
      //   startDate: startDate?.toISOString().split('T')[0],
      //   endDate: endDate?.toISOString().split('T')[0]
      // });
      
      // Имитация генерации отчета
      setTimeout(() => {
        const titles: Record<string, string> = {
          'active_fires': 'Отчет по активным пожарам',
          'monthly_statistics': `Статистика пожаров за период ${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`,
          'stations_performance': `Отчет по работе пожарных частей за период ${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`
        };
        
        const newReport: Report = {
          id: Math.max(...reports.map(r => r.id), 0) + 1,
          title: titles[type] || 'Новый отчет',
          type,
          createdAt: new Date().toISOString(),
          startDate: startDate?.toISOString().split('T')[0],
          endDate: endDate?.toISOString().split('T')[0],
          userId: user?.id || 1,
          fileUrl: '#'
        };
        
        setReports([newReport, ...reports]);
        toast.success('Отчет успешно сгенерирован');
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Ошибка при генерации отчета');
      setIsGenerating(false);
    }
  };
  
  const getReportTypeText = (type: string): string => {
    switch (type) {
      case 'active_fires':
        return 'Активные пожары';
      case 'monthly_statistics':
        return 'Статистика за период';
      case 'stations_performance':
        return 'Работа пожарных частей';
      default:
        return type;
    }
  };
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const filteredReports = reports.filter(report => {
    if (reportType && report.type !== reportType) {
      return false;
    }
    
    if (startDate && report.endDate && new Date(report.endDate) < startDate) {
      return false;
    }
    
    if (endDate && report.startDate && new Date(report.startDate) > endDate) {
      return false;
    }
    
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Отчеты</h1>
          <p className="text-gray-600 mt-1">
            Генерируйте отчеты о работе и просматривайте историю.
          </p>
        </div>
        
        {/* Блок генерации отчетов */}
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Создать новый отчет</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">Активные пожары</h3>
              <p className="text-sm text-gray-600">
                Генерирует отчет по текущим активным пожарам.
              </p>
              <button 
                onClick={() => handleGenerateReport('active_fires')}
                disabled={isGenerating}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {isGenerating ? 'Генерация...' : 'Создать отчет'}
              </button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">Статистика за период</h3>
              <p className="text-sm text-gray-600">
                Генерирует статистику по пожарам за выбранный период.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <DatePickerInput
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Начальная дата"
                  className="w-full"
                />
                <DatePickerInput
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Конечная дата"
                  className="w-full"
                />
              </div>
              <button 
                onClick={() => handleGenerateReport('monthly_statistics')}
                disabled={isGenerating}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {isGenerating ? 'Генерация...' : 'Создать отчет'}
              </button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">Работа пожарных частей</h3>
              <p className="text-sm text-gray-600">
                Генерирует отчет по эффективности работы пожарных частей.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <DatePickerInput
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Начальная дата"
                  className="w-full"
                />
                <DatePickerInput
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Конечная дата"
                  className="w-full"
                />
              </div>
              <button 
                onClick={() => handleGenerateReport('stations_performance')}
                disabled={isGenerating}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {isGenerating ? 'Генерация...' : 'Создать отчет'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Фильтры для отчетов */}
        <div className="bg-white p-4 shadow-md rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-1">
                Тип отчета
              </label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Все типы</option>
                <option value="active_fires">Активные пожары</option>
                <option value="monthly_statistics">Статистика за период</option>
                <option value="stations_performance">Работа пожарных частей</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                С даты
              </label>
              <DatePickerInput
                value={startDate}
                onChange={setStartDate}
                placeholder="Выберите дату"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                По дату
              </label>
              <DatePickerInput
                value={endDate}
                onChange={setEndDate}
                placeholder="Выберите дату"
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Список отчетов */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Период
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.length > 0 ? (
                    filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getReportTypeText(report.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.startDate && report.endDate ? 
                            `${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}` : 
                            'Н/Д'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a 
                            href={report.fileUrl} 
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            onClick={(e) => {
                              e.preventDefault();
                              toast.info('Скачивание отчета будет доступно в полной версии');
                            }}
                          >
                            Скачать
                          </a>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => {
                              setReports(reports.filter(r => r.id !== report.id));
                              toast.success('Отчет удален');
                            }}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Отчеты не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 