'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { DatePickerInput } from '@mantine/dates';
import { Select } from '@mantine/core';
import { useFireStationStore } from '@/store/fire-station-store';

interface FireStation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Report {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  fireIncidentId: number;
  user?: {
    name: string;
    role: string;
  };
}

interface GeneratedReport {
  id: number;
  title: string;
  type: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  stationId?: number;
  userId: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const { stations, fetchStations } = useFireStationStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Фильтры
  const [reportType, setReportType] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        try {
          // Получаем список пожарных частей, если они еще не загружены
          if (stations.length === 0) {
            await fetchStations();
          }
        } catch (error) {
          console.error('Error fetching stations:', error);
          // Продолжаем выполнение, даже если не удалось загрузить станции
        }
        
        try {
          // Загружаем отчеты
          const response = await api.get('/api/report');
          setReports(response.data || []);
        } catch (error) {
          console.error('Error fetching reports:', error);
          // Продолжаем выполнение, даже если не удалось загрузить отчеты
        }
        
        // Загружаем историю сгенерированных отчетов
        // В реальном приложении здесь должен быть API для получения истории сгенерированных отчетов
        // Пока используем localStorage
        try {
          const savedReports = localStorage.getItem('generatedReports');
          if (savedReports) {
            setGeneratedReports(JSON.parse(savedReports));
          }
        } catch (error) {
          console.error('Error parsing saved reports:', error);
          setGeneratedReports([]);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast.error('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id, stations.length, fetchStations]);
  
  const handleGenerateReport = async (type: string) => {
    if ((type === 'monthly_statistics' || type === 'stations_performance') && (!startDate || !endDate)) {
      toast.error('Выберите начальную и конечную даты для отчета');
      return;
    }
    
    try {
      setIsGenerating(true);
      
      let fileName = '';
      let title = '';
      
      if (type === 'active_fires') {
        title = 'Отчет по активным пожарам';
        
        // Сохраняем информацию о сгенерированном отчете
        const newReport: GeneratedReport = {
          id: Date.now(),
          title,
          type,
          createdAt: new Date().toISOString(),
          userId: user?.id || 0
        };
        
        const updatedReports = [newReport, ...generatedReports];
        setGeneratedReports(updatedReports);
        try {
          localStorage.setItem('generatedReports', JSON.stringify(updatedReports));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
        
        toast.success('Отчет успешно сгенерирован');
      } else if (type === 'monthly_statistics' || type === 'stations_performance') {
        const format = type === 'monthly_statistics' ? 'pdf' : 'excel';
        const params: Record<string, string> = {
          startDate: startDate!.toISOString(),
          endDate: endDate!.toISOString()
        };
        
        if (selectedStationId) {
          params.stationId = selectedStationId;
        }
        
        console.log('Sending report request with params:', params);
        
        const queryString = new URLSearchParams(params).toString();
        // Используем локальный API роутер вместо прямого обращения к бэкенду
        const url = `/api/report/statistics/${format}?${queryString}`;
        
        // Открываем ссылку для скачивания файла
        window.open(url, '_blank');
        
        const periodText = `${startDate!.toLocaleDateString()} - ${endDate!.toLocaleDateString()}`;
        title = type === 'monthly_statistics' 
          ? `Статистика пожаров за период ${periodText}`
          : `Отчет по работе пожарных частей за период ${periodText}`;
        
        // Сохраняем информацию о сгенерированном отчете
        const newReport: GeneratedReport = {
          id: Date.now(),
          title,
          type,
          createdAt: new Date().toISOString(),
          startDate: startDate!.toISOString(),
          endDate: endDate!.toISOString(),
          stationId: selectedStationId ? parseInt(selectedStationId, 10) : undefined,
          userId: user?.id || 0
        };
        
        const updatedReports = [newReport, ...generatedReports];
        setGeneratedReports(updatedReports);
        try {
          localStorage.setItem('generatedReports', JSON.stringify(updatedReports));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
        
        toast.success('Отчет успешно сгенерирован');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Ошибка при генерации отчета');
    } finally {
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
  
  const handleDownloadReport = (report: GeneratedReport, format: 'pdf' | 'excel') => {
    try {
      let url = '';
      
      if (report.type === 'active_fires') {
        // Для активных пожаров просто уведомление
        toast.info('Отчет по активным пожарам будет доступен в ближайшее время');
        return;
      } else if (report.type === 'monthly_statistics' || report.type === 'stations_performance') {
        const params: Record<string, string> = {
          startDate: report.startDate!,
          endDate: report.endDate!
        };
        
        if (report.stationId) {
          params.stationId = String(report.stationId);
        }
        
        console.log('Downloading report with params:', params);
        
        const queryString = new URLSearchParams(params).toString();
        url = `/api/report/statistics/${format}?${queryString}`;
        
        // Открываем ссылку для скачивания файла
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Ошибка при скачивании отчета');
    }
  };
  
  const handleDeleteReport = (reportId: number) => {
    const updatedReports = generatedReports.filter(r => r.id !== reportId);
    setGeneratedReports(updatedReports);
    try {
      localStorage.setItem('generatedReports', JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    toast.success('Отчет удален из истории');
  };
  
  const filteredReports = generatedReports.filter(report => {
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <Select
                  data={[
                    { value: '', label: 'Все пожарные части' },
                    ...stations.map((station: any) => ({ 
                      value: String(station.id), 
                      label: station.name 
                    }))
                  ]}
                  value={selectedStationId}
                  onChange={setSelectedStationId}
                  placeholder="Выберите пожарную часть"
                  className="w-full col-span-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleGenerateReport('monthly_statistics')}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isGenerating ? 'Генерация...' : 'PDF отчет'}
                </button>
                <button 
                  onClick={() => handleGenerateReport('stations_performance')}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isGenerating ? 'Генерация...' : 'Excel отчет'}
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">Информация</h3>
              <p className="text-sm text-gray-600">
                Вы можете генерировать отчеты в формате PDF и Excel. После генерации отчета вы можете скачать его по ссылке в таблице ниже.
              </p>
              <p className="text-sm text-gray-600">
                Отчеты содержат информацию о пожарах, статистику и другие данные, которые могут быть полезны для анализа.
              </p>
              <p className="text-sm text-gray-600 font-medium">
                PDF-отчеты содержат общую статистику, а Excel-отчеты дополнительно включают детальные таблицы с возможностью дальнейшей обработки данных.
              </p>
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
                          {report.type !== 'active_fires' && (
                            <>
                              <button 
                                onClick={() => handleDownloadReport(report, 'pdf')}
                                className="text-indigo-600 hover:text-indigo-900 mr-2"
                              >
                                PDF
                              </button>
                              <button 
                                onClick={() => handleDownloadReport(report, 'excel')}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Excel
                              </button>
                            </>
                          )}
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteReport(report.id)}
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