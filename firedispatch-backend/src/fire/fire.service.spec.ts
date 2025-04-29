import { Test, TestingModule } from '@nestjs/testing';
import { FireService } from './fire.service';

describe('FireService', () => {
  let service: FireService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FireService],
    }).compile();

    service = module.get<FireService>(FireService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
