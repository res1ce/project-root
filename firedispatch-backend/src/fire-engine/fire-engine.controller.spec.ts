import { Test, TestingModule } from '@nestjs/testing';
import { FireEngineController } from './fire-engine.controller';

describe('FireEngineController', () => {
  let controller: FireEngineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FireEngineController],
    }).compile();

    controller = module.get<FireEngineController>(FireEngineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
