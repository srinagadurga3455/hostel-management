import { Test, TestingModule } from '@nestjs/testing';
import { FoodMenuService } from './food-menu.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FoodMenuService', () => {
  let service: FoodMenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodMenuService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<FoodMenuService>(FoodMenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
