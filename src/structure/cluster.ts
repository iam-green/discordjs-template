import { ClusterConfig } from '@/config';
import { ClusterManager } from 'discord-hybrid-sharding';

export class Cluster {
  static manager: ClusterManager;

  static async spawn() {
    const is_ts = process.argv[1].endsWith('.ts');
    this.manager = new ClusterManager(
      `${__dirname}/../cluster.${is_ts ? 'ts' : 'js'}`,
      {
        token: process.env.BOT_TOKEN,
        ...ClusterConfig,
        execArgv: [
          '-r',
          'tsconfig-paths/register',
          ...(is_ts ? ['-r', 'ts-node/register'] : []),
        ],
      },
    );
    await this.manager.spawn({ timeout: -1 });
  }
}
