import { AppDataSource } from '../config/data_source';
import { Promotion } from '../models/promotion.model';
import { PromotionService } from '../services/promotion/implement/promotion.service.implement';

export function initializePromotionScheduler(): void {
  // chạy mỗi 60s
  const TICK_MS = 60_000;
  const run = async () => {
    try {
      const repo = AppDataSource.getRepository(Promotion);
      const now = new Date();
      const service = new PromotionService();

      // Các promotion active, đang nằm trong khung thời gian -> đảm bảo đã áp
      const duePromos = await repo
        .createQueryBuilder('p')
        .where('p.active = :active', { active: true })
        .andWhere('(p.start_date IS NULL OR p.start_date <= :now)', { now })
        .andWhere('(p.end_date IS NULL OR p.end_date >= :now)', { now })
        .getMany();

      for (const p of duePromos) {
        await service.activate(p.id); // idempotent: sẽ áp lại nếu cần
      }

      // Các promotion active nhưng đã hết hạn -> tắt và gỡ
      const expiredPromos = await repo
        .createQueryBuilder('p')
        .where('p.active = :active', { active: true })
        .andWhere('p.end_date IS NOT NULL AND p.end_date < :now', { now })
        .getMany();

      for (const p of expiredPromos) {
        await service.deactivate(p.id); // gỡ khỏi variants + reindex
      }
    } catch (e) {
      console.error('[PromotionScheduler] Tick error:', e);
    }
  };

  // chạy ngay 1 lần khi khởi động và sau đó lặp
  run();
  setInterval(run, TICK_MS);
}
