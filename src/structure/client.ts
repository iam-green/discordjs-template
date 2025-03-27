import { ClusterClient } from 'discord-hybrid-sharding';
import { Client, ClientOptions } from 'discord.js';

export class ExtendedClient extends Client {
  cluster = new ClusterClient(this);

  constructor(option: ClientOptions) {
    super(option);
  }

  // TODO: 필요한 함수 및 변수 구현
}
