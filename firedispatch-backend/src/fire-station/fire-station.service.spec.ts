import { Test, TestingModule } from '@nestjs/testing';
import { FireStationService } from './fire-station.service';

describe('FireStationService', () => {
  let service: FireStationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FireStationService],
    }).compile();

    service = module.get<FireStationService>(FireStationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
