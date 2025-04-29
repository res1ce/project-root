import { Test, TestingModule } from '@nestjs/testing';
import { FireController } from './fire.controller';

describe('FireController', () => {
  let controller: FireController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FireController],
    }).compile();

    controller = module.get<FireController>(FireController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
