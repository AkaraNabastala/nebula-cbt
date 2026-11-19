import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  const mockHealth = {
    status: 'ok',
    database: 'connected',
    application: 'AkaraNabastala CBT',
    timestamp: '2026-11-18T00:00:00.000Z',
  };

  const mockAppService = {
    getHealth: vi.fn().mockResolvedValue(mockHealth),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return application health status', async () => {
      await expect(appController.getHealth()).resolves.toEqual(mockHealth);
      expect(mockAppService.getHealth).toHaveBeenCalledTimes(1);
    });
  });
});
