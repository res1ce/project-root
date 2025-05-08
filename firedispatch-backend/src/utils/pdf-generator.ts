import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');
import { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
import { Logger } from '@nestjs/common';

export class PdfGenerator {
  private printer: any;
  private readonly logger = new Logger('PdfGenerator');
  
  constructor() {
    // Определяем пути к шрифтам
    const fontsPath = path.join(process.cwd(), 'assets', 'fonts');
    
    // Проверяем наличие шрифтов и добавляем логирование их путей
    const regularFontPath = path.join(fontsPath, 'Roboto-Regular.ttf');
    const boldFontPath = path.join(fontsPath, 'Roboto-Bold.ttf');
    const italicFontPath = path.join(fontsPath, 'Roboto-Italic.ttf');
    const boldItalicFontPath = path.join(fontsPath, 'Roboto-BoldItalic.ttf');
    
    this.logger.log(`Проверка наличия шрифтов:`);
    this.logger.log(`Regular: ${regularFontPath}, существует: ${fs.existsSync(regularFontPath)}`);
    this.logger.log(`Bold: ${boldFontPath}, существует: ${fs.existsSync(boldFontPath)}`);
    this.logger.log(`Italic: ${italicFontPath}, существует: ${fs.existsSync(italicFontPath)}`);
    this.logger.log(`BoldItalic: ${boldItalicFontPath}, существует: ${fs.existsSync(boldItalicFontPath)}`);
    
    // Проверяем наличие всех шрифтов
    if (!fs.existsSync(regularFontPath) || 
        !fs.existsSync(boldFontPath) || 
        !fs.existsSync(italicFontPath) || 
        !fs.existsSync(boldItalicFontPath)) {
      this.logger.warn('Не все шрифты найдены! Используем стандартные шрифты PDFMake.');
      
      // Используем встроенные шрифты, если не нашли пользовательские
      const fonts = {
        Roboto: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };
      
      this.printer = new PdfPrinter(fonts);
    } else {
      this.logger.log('Найдены все необходимые шрифты с поддержкой кириллицы.');
      
      try {
        // Проверяем размеры файлов шрифтов для диагностики
        const regularFontSize = fs.statSync(regularFontPath).size;
        const boldFontSize = fs.statSync(boldFontPath).size;
        const italicFontSize = fs.statSync(italicFontPath).size;
        const boldItalicFontSize = fs.statSync(boldItalicFontPath).size;
        
        this.logger.log(`Размеры шрифтов: Regular=${regularFontSize}, Bold=${boldFontSize}, Italic=${italicFontSize}, BoldItalic=${boldItalicFontSize}`);
        
        // Используем шрифты Roboto с поддержкой кириллицы
        const fonts = {
          Roboto: {
            normal: regularFontPath,
            bold: boldFontPath,
            italics: italicFontPath,
            bolditalics: boldItalicFontPath
          }
        };
        
        this.printer = new PdfPrinter(fonts);
        this.logger.log('PDF принтер успешно инициализирован с пользовательскими шрифтами.');
      } catch (error) {
        this.logger.error(`Ошибка при инициализации шрифтов: ${error.message}`);
        
        // В случае ошибки используем стандартные шрифты
        const fonts = {
          Roboto: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique'
          }
        };
        
        this.printer = new PdfPrinter(fonts);
        this.logger.log('PDF принтер инициализирован со стандартными шрифтами из-за ошибки.');
      }
    }
  }
  
  /**
   * Создает PDF документ и сохраняет его в указанный путь
   * @param docDefinition Определение документа
   * @param outputPath Путь сохранения PDF
   * @returns Promise с путем к файлу
   */
  async createPdf(docDefinition: TDocumentDefinitions, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.logger.log(`Начинаем создание PDF документа...`);
        const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
        const writeStream = fs.createWriteStream(outputPath);
        
        pdfDoc.pipe(writeStream);
        
        writeStream.on('finish', () => {
          this.logger.log(`PDF успешно создан: ${outputPath}`);
          resolve(outputPath);
        });
        
        writeStream.on('error', (error) => {
          this.logger.error(`Ошибка при записи PDF: ${error.message}`);
          reject(error);
        });
        
        pdfDoc.end();
      } catch (error) {
        this.logger.error(`Ошибка при создании PDF: ${error.message}`);
        reject(error);
      }
    });
  }
} 