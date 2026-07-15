import { Op } from 'sequelize';
import models from '../models/index.js';

const { ProductChangeLog } = models;

export default async function productChangeLogRoutes(fastify, opts) {
  // GET /api/change-logs
  // Query params: supplierId, sku, action, from, to, page, limit
  fastify.get('/change-logs', async (request, reply) => {
    try {
      const {
        supplierId,
        sku,
        action,
        from,
        to,
        page = 1,
        limit = 50,
      } = request.query;

      const where = {};

      if (supplierId) where.supplierId = supplierId;
      if (sku) where.sku = sku;
      if (action) {
        const allowed = ['added', 'removed', 'changed'];
        if (!allowed.includes(action)) {
          return reply.code(400).send({ error: `action must be one of: ${allowed.join(', ')}` });
        }
        where.action = action;
      }

      if (from || to) {
        where.pollCycleAt = {};
        if (from) where.pollCycleAt[Op.gte] = new Date(from);
        if (to) where.pollCycleAt[Op.lte] = new Date(to);
      }

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
      const offset = (pageNum - 1) * limitNum;

      const { rows, count } = await ProductChangeLog.findAndCountAll({
        where,
        order: [['pollCycleAt', 'DESC'], ['id', 'DESC']],
        limit: limitNum,
        offset,
      });

      return {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
        data: rows,
      };
    } catch (err) {
      fastify.log.error(`[change-logs] failed to fetch: ${err.message}`);
      return reply.code(500).send({ error: 'Failed to fetch change logs' });
    }
  });

  // GET /api/change-logs/summary
  // Quick counts per supplier/action, useful for a dashboard
  fastify.get('/change-logs/summary', async (request, reply) => {
    try {
      const { from, to } = request.query;
      const where = {};

      if (from || to) {
        where.pollCycleAt = {};
        if (from) where.pollCycleAt[Op.gte] = new Date(from);
        if (to) where.pollCycleAt[Op.lte] = new Date(to);
      }

      const rows = await ProductChangeLog.findAll({
        where,
        attributes: [
          'supplierId',
          'action',
          [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count'],
        ],
        group: ['supplierId', 'action'],
        raw: true,
      });

      return { data: rows };
    } catch (err) {
      fastify.log.error(`[change-logs] failed to fetch summary: ${err.message}`);
      return reply.code(500).send({ error: 'Failed to fetch summary' });
    }
  });

  // GET /api/change-logs/:sku
  // All history for a single SKU across cycles
  fastify.get('/change-logs/:sku', async (request, reply) => {
    try {
      const { sku } = request.params;
      const { supplierId } = request.query;

      const where = { sku };
      if (supplierId) where.supplierId = supplierId;

      const rows = await ProductChangeLog.findAll({
        where,
        order: [['pollCycleAt', 'DESC'], ['id', 'DESC']],
      });

      return { data: rows };
    } catch (err) {
      fastify.log.error(`[change-logs] failed to fetch sku history: ${err.message}`);
      return reply.code(500).send({ error: 'Failed to fetch SKU history' });
    }
  });
}