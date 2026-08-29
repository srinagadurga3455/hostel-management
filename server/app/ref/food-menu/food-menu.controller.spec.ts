import { Test, TestingModule } from '@nestjs/testing';
import { FoodMenuController } from './food-menu.controller';
import { FoodMenuService } from './food-menu.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('FoodMenuController', () => {
  let controller: FoodMenuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodMenuController],
      providers: [{ provide: FoodMenuService, useValue: {} }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FoodMenuController>(FoodMenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
