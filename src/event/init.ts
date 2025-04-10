import { Koreanbots } from '@/common';
import { ExtendedEvent } from '@/structure';

export const koreanbots = new ExtendedEvent({
  event: 'ready',
  once: true,
  run: async (client) => {
    if (client.cluster.id != 0 || !process.env.KOREANBOTS_TOKEN) return;
    setInterval(() => Koreanbots.update(client.cluster), 1000 * 60 * 10);
  },
});
