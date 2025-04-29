import { Test, TestingModule } from '@nestjs/testing';
import { FireEngineService } from './fire-engine.service';

describe('FireEngineService', () => {
  let service: FireEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FireEngineService],
    }).compile();

    service = module.get<FireEngineService>(FireEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
