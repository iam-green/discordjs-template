import { ClusterConfig } from '@/config';
import { ClusterClient, ClusterManager } from 'discord-hybrid-sharding';
import { Status } from 'discord.js';

export class Cluster {
  static manager: ClusterManager;

  static async spawn() {
    const is_ts = process.argv[1].endsWith('.ts');
    this.manager = new ClusterManager(
      `${__dirname}/../cluster.${is_ts ? 'ts' : 'js'}`,
      {
        token: process.env.BOT_TOKEN,
        ...ClusterConfig,
        mode:
          process.env.NODE_ENV != 'production' ? 'worker' : ClusterConfig.mode,
        execArgv: [
          ...(is_ts ? ['-r', '@swc-node/register'] : []),
          '-r',
          'tsconfig-paths/register',
        ],
      },
    );
    await this.manager.spawn({ timeout: -1 });
  }

  static async status(
    cluster: ClusterManager | ClusterClient = this.manager,
  ): Promise<
    {
      id: number;
      status: keyof typeof Status;
      shard: number[];
      guild_count: number;
      user_count: number;
      latency: number;
      uptime: number;
      memory: string;
    }[]
  > {
    return (
      await cluster.broadcastEval(`({
        id: this.cluster.id,
        status: this.ws.status,
        shard: this.cluster.shardList,
        guild_count: this.guilds.cache.size,
        user_count: this.users.cache.size,
        latency: this.ws.ping,
        uptime: this.uptime,
        memory: +(process.memoryUsage().rss / 1024 / 1024).toFixed(2),
      })`)
    ).map((v) => ({ ...v, status: Status[v.status] }));
  }
}
