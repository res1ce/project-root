import { Test, TestingModule } from '@nestjs/testing';
import { FireStationController } from './fire-station.controller';

describe('FireStationController', () => {
  let controller: FireStationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FireStationController],
    }).compile();

    controller = module.get<FireStationController>(FireStationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
