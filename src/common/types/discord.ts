import {
  BaseInteraction,
  BaseMessageOptions,
  InteractionReplyOptions,
} from 'discord.js';

export type GuildInteraction<
  T extends BaseInteraction,
  InGuild extends boolean,
> = InGuild extends true
  ? T & {
      guild: NonNullable<T['guild']>;
      guildId: NonNullable<T['guildId']>;
      guildLocale: NonNullable<T['guildLocale']>;
      member: NonNullable<T['member']>;
      memberPermissions: NonNullable<T['memberPermissions']>;
    }
  : T;

export type MessageOptionType = 'message' | 'interaction';

export type MessageOption<T extends MessageOptionType> = T extends 'message'
  ? BaseMessageOptions
  : InteractionReplyOptions;
