import { BaseInteraction } from 'discord.js';
import { NonNull } from './util';

export type GuildInteraction<
  T extends BaseInteraction,
  InGuild extends boolean,
> = InGuild extends true
  ? T & {
      guild: NonNull<T['guild']>;
      guildId: NonNull<T['guildId']>;
      guildLocale: NonNull<T['guildLocale']>;
      member: NonNull<T['member']>;
      memberPermissions: NonNull<T['memberPermissions']>;
    }
  : T;
