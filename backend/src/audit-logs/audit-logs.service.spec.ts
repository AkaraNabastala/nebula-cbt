import { ForbiddenException } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { ListAuditLogsDto } from './dto/list-audit-logs.dto.js';

describe('AuditLogsService', () => {
  const prisma = {
    auditLog: { findMany: vi.fn(), count: vi.fn() },
  } as unknown as PrismaService;
  const service = new AuditLogsService(prisma);

  beforeEach(() => vi.clearAllMocks());

  it('returns actor details using the public actorUser response field', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([{
      id: 'log-1',
      action: 'AUTH_LOGIN',
      actor: { id: 'admin-1', fullName: 'Administrator' },
    }] as never);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(1);

    const result = await service.list({ page: 1, limit: 20 } as ListAuditLogsDto, { roles: ['ADMIN'] });

    expect(result.items[0]).toMatchObject({
      id: 'log-1',
      actorUser: { id: 'admin-1', fullName: 'Administrator' },
    });
    expect(result.items[0]).not.toHaveProperty('actor');
  });

  it('rejects users without the administrator role', async () => {
    await expect(service.list({} as ListAuditLogsDto, { roles: ['TEACHER'] }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });
});
