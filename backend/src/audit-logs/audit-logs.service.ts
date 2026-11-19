import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ListAuditLogsDto } from './dto/list-audit-logs.dto.js';

type Actor = { roles: string[] };

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(dto: ListAuditLogsDto, actor: Actor) {
    if (!actor.roles.includes('ADMIN')) throw new ForbiddenException('Hanya administrator yang dapat melihat audit log.');
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const where = {
      ...(dto.action ? { action: { contains: dto.action, mode: 'insensitive' as const } } : {}),
      ...(dto.entityType ? { entityType: { contains: dto.entityType, mode: 'insensitive' as const } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { actor: { select: { id: true, fullName: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      items: items.map(({ actor, ...item }) => ({ ...item, actorUser: actor })),
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    };
  }
}
