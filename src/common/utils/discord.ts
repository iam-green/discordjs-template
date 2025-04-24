import { ExtendedClient } from '@/structure';
import {
  MessageCreateOptions,
  PermissionFlags,
  PermissionResolvable,
  PermissionsBitField,
  REST,
  RouteBases,
  Routes,
} from 'discord.js';
import { toArray } from './array';
import { streamToBuffer } from './stream';

export class DiscordUtil {
  static clientId = '';
  static otherClientId: string[] = [];
  static adminId: string[] = [];
  static developerId: string[] = [];
  static commandId: Record<string, string> = {};

  static async refresh() {
    if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN is missing');

    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const result: any = await rest.get(Routes.currentApplication());
    const team = result.team
      ? await (
          await fetch(
            `${RouteBases.api}/teams/${result.team.id}/applications`,
            {
              headers: { Authorization: process.env.DISCORD_USER_TOKEN ?? '' },
            },
          )
        ).json()
      : null;

    this.clientId = result.id;
    this.adminId = result.team
      ? result.team.members
          .filter((v) => v.role == 'admin')
          .map((v) => v.user.id as string)
      : [result.owner.id as string];
    this.developerId = result.team
      ? result.team.members
          .filter((v) => v.role == 'developer')
          .map((v) => v.user.id as string)
      : [];
    this.otherClientId =
      result.team && process.env.DISCORD_USER_TOKEN
        ? team.map((v) => v.id).filter((v) => v != result.id)
        : [];
    this.commandId = (
      (await rest.get(Routes.applicationCommands(this.clientId))) as any[]
    ).reduce((a, b) => ({ ...a, [b.name]: b.id }), {});
  }

  static commandMention(name: string) {
    return `</${name}:${this.commandId[name.split(' ')[0]] ?? 0}>`;
  }

  static async send(
    client: ExtendedClient,
    channelId: string,
    message: string | MessageCreateOptions,
  ) {
    if (typeof message != 'string' && message.files) {
      const files = toArray<any>(message.files);
      message.files = await Promise.all(
        files.map(async (file) => {
          if (typeof file == 'string') return file;
          const { attachment } = file;
          if (Buffer.isBuffer(attachment)) {
            return {
              ...file,
              attachment: attachment.toString('base64'),
              encoding: 'base64',
            };
          } else if (attachment && typeof attachment.pipe === 'function') {
            const buffer = await streamToBuffer(attachment);
            return {
              ...file,
              attachment: buffer.toString('base64'),
              encoding: 'base64',
            };
          }
          return file;
        }),
      );
    }

    const result = await client.cluster
      .broadcastEval(
        async (client, { channelId, message }) => {
          const channel =
            client.channels.cache.get(channelId) ??
            (await client.channels.fetch(channelId).catch(() => null));
          if (!channel?.isSendable()) return;
          if (typeof message != 'string' && message.files) {
            message.files = message.files.map((file: any) =>
              file.encoding == 'base64' && typeof file.attachment == 'string'
                ? {
                    ...file,
                    attachment: Buffer.from(file.attachment, 'base64'),
                  }
                : file,
            );
          }
          const result = await channel.send(message as any);
          return result.id;
        },
        { context: { channelId, message } },
      )
      .catch(client.error);

    return (result ?? []).find((v) => v);
  }

  static convertPermissionToString(
    value: PermissionResolvable,
  ): keyof typeof PermissionsBitField.Flags {
    return (
      typeof value != 'bigint' && !/^-?\d+$/.test(value.toString())
        ? value
        : Object.entries(PermissionsBitField.Flags).find(
            ([, v]) => v == value,
          )![0]
    ) as keyof PermissionFlags;
  }

  static checkPermission(
    memberPermission?: Readonly<PermissionsBitField> | null,
    ...needPermission: PermissionResolvable[]
  ) {
    return needPermission.filter((v) => !memberPermission?.has(v));
  }
}
