import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, format: string } }
) {
  try {
    const { id, format } = params;

    // Получаем JWT токен из cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Формируем URL для запроса к бэкенду
    const apiUrl = `${API_BASE_URL}/api/report/fire-incident/${id}/${format}`;

    console.log('Proxying fire incident report request to:', apiUrl);

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
      : `fire_report_${id}_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

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
    console.error('Error proxying fire incident report request:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении отчета' },
      { status: 500 }
    );
  }
} 