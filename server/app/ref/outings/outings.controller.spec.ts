import { Test, TestingModule } from '@nestjs/testing';
import { OutingsController } from './outings.controller';
import { OutingsService } from './outings.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('OutingsController', () => {
  let controller: OutingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutingsController],
      providers: [{ provide: OutingsService, useValue: {} }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OutingsController>(OutingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
