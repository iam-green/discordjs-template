import { REST, RouteBases, Routes } from 'discord.js';

export class DiscordUtil {
  static client_id = '';
  static other_client_id = '';
  static admin_id: string[] = [];
  static developer_id: string[] = [];

  static async refresh() {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');

    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const result: any = await rest.get(Routes.currentApplication());
    const team = await (
      await fetch(`${RouteBases.api}/teams/${result.team.id}/applications`)
    ).json();

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
  }
}
