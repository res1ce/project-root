import { Controller, Post, Body, UseGuards, BadRequestException, Get, Param, Delete, Req, Res, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Response, Request } from 'express';
import * as fs from 'fs';
import { CreateFireReportDto } from './dto/create-fire-report.dto';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTRAL_DISPATCHER', 'STATION_DISPATCHER')
  @Post()
  async create(@Req() req: RequestWithUser, @Body() dto: CreateReportDto) {
    try {
      return await this.reportService.create(req.user.userId, dto);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getAll() {
    return this.reportService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.reportService.getById(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTRAL_DISPATCHER', 'STATION_DISPATCHER')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.reportService.delete(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CENTRAL_DISPATCHER', 'STATION_DISPATCHER')
  @Post('fire-incident')
  async createFireReport(@Req() req: RequestWithUser, @Body() dto: CreateFireReportDto) {
    try {
      return await this.reportService.createFireReport(
        req.user.userId,
        dto.fireIncidentId,
        dto.content
      );
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('fire-incident/:fireIncidentId')
  async getFireReports(@Param('fireIncidentId') fireIncidentId: string) {
    return this.reportService.getFireReports(Number(fireIncidentId));
  }

  @UseGuards(JwtAuthGuard)
  @Get('fire-incident/:fireIncidentId/pdf')
  async getFireIncidentPdf(
    @Param('fireIncidentId') fireIncidentId: string,
    @Res() res: Response
  ) {
    try {
      const pdfPath = await this.reportService.generateFireIncidentPDF(Number(fireIncidentId));
      
      // Отправляем файл
      const filename = pdfPath.split('/').pop();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
      
      // Удаляем файл после отправки
      fileStream.on('end', () => {
        fs.unlinkSync(pdfPath);
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('statistics/pdf')
  async getStatisticsPdf(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('stationId') stationIdStr: string,
    @Res() res: Response
  ) {
    try {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      const stationId = stationIdStr ? Number(stationIdStr) : undefined;
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      
      const pdfPath = await this.reportService.generateStatisticsReport(
        startDate,
        endDate,
        stationId
      );
      
      // Отправляем файл
      const filename = pdfPath.split('/').pop();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
      
      // Удаляем файл после отправки
      fileStream.on('end', () => {
        fs.unlinkSync(pdfPath);
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
