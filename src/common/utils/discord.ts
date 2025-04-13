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
  static client_id = '';
  static other_client_id = '';
  static admin_id: string[] = [];
  static developer_id: string[] = [];
  static command_id: Record<string, string> = {};

  static async refresh() {
    if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN is missing');

    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const result: any = await rest.get(Routes.currentApplication());
    const team = result.team
      ? await (
          await fetch(`${RouteBases.api}/teams/${result.team.id}/applications`)
        ).json()
      : null;

    this.client_id = result.id;
    this.admin_id = result.team
      ? result.team.members
          .filter((v) => v.role == 'admin')
          .map((v) => v.user.id as string)
      : [result.owner.id as string];
    this.developer_id = result.team
      ? result.team.members
          .filter((v) => v.role == 'developer')
          .map((v) => v.user.id as string)
      : [];
    this.other_client_id =
      result.team && process.env.DISCORD_USER_TOKEN
        ? team.map((v) => v.id).filter((v) => v != result.id)
        : [];
    this.command_id = (
      (await rest.get(Routes.applicationCommands(this.client_id))) as any[]
    ).reduce((a, b) => ({ ...a, [b.name]: b.id }), {});
  }

  static commandMention(name: string) {
    return `</${name}:${this.command_id[name.split(' ')[0]] ?? 0}>`;
  }

  static async send(
    client: ExtendedClient,
    channel_id: string,
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
        async (client, { channel_id, message }) => {
          const channel = await client.channels.fetch(channel_id);
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
        { context: { channel_id, message } },
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
    member_permission?: Readonly<PermissionsBitField> | null,
    ...need_permission: PermissionResolvable[]
  ) {
    return need_permission.filter((v) => !member_permission?.has(v));
  }
}
