import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  context: { params: { format: string } }
) {
  try {
    const params = await context.params;
    const format = params.format;
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const stationId = searchParams.get('stationId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Требуются параметры startDate и endDate' },
        { status: 400 }
      );
    }

    // Получаем JWT токен из cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Формируем URL для запроса к бэкенду
    let apiUrl = `${API_BASE_URL}/api/report/statistics/${format}?startDate=${startDate}&endDate=${endDate}`;
    if (stationId) {
      apiUrl += `&stationId=${stationId}`;
    }

    console.log('Proxying request to:', apiUrl);

    // Выполняем запрос к бэкенду
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from backend:', errorText);
      return NextResponse.json(
        { error: `Ошибка при получении отчета: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Получаем filename из Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
      : `report_${format}_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

    // Получаем содержимое файла
    const fileBuffer = await response.arrayBuffer();

    // Возвращаем файл с правильными заголовками
    const contentType = format === 'pdf' 
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error('Error proxying report request:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении отчета' },
      { status: 500 }
    );
  }
} 