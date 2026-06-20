import type express from 'express';
import { assertDatabaseReady, isFallbackAllowed, isPersistenceEnabled } from '../db/runtime';

export function registerDbHealthRoute(app: express.Express): void {
  app.get('/api/health/db', async (_req, res) => {
    try {
      await assertDatabaseReady();
      res.json({
        success: true,
        data: {
          connected: true,
          persistenceEnabled: isPersistenceEnabled(),
          fallbackEnabled: isFallbackAllowed(),
        },
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        data: {
          connected: false,
          persistenceEnabled: isPersistenceEnabled(),
          fallbackEnabled: isFallbackAllowed(),
        },
        error: error instanceof Error ? error.message : '数据库不可用',
      });
    }
  });
}
