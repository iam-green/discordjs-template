import {
  PermissionFlags,
  PermissionResolvable,
  PermissionsBitField,
  REST,
  RouteBases,
  Routes,
} from 'discord.js';

export class DiscordUtil {
  static client_id = '';
  static other_client_id = '';
  static admin_id: string[] = [];
  static developer_id: string[] = [];
  static command_id: Record<string, string> = {};

  static async refresh() {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');

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
