import { Log, sep, toArray, ValueOrArray } from '@/common';
import { Locale, Message, PermissionResolvable } from 'discord.js';
import { ExtendedClient } from './client';
import { glob } from 'glob';
import chalk from 'chalk';
import { BotConfig } from '@/config';

export type TextCommandRunOptions<InGuild extends boolean> = {
  client: ExtendedClient;
  message: Message<InGuild>;
  locale: Locale;
};

export type ExtendedTextCommandType<InGuild extends boolean> = {
  /**
   * Text Command Name
   * * By using an array, you can create a text command with multiple names.
   * @example 'ping'
   * @example ['ping', 'p']
   */
  name: ValueOrArray<string>;

  /**
   * Text Command Options
   * * You can set desired options for the text command.
   */
  options?: Partial<{
    /**
     * Whether the text command is only available in guilds
     * * If you enable this option, you can import guild-related information.
     * @default false
     */
    onlyGuild: InGuild;

    /**
     * Whether the text command is only available in development
     * @default false
     */
    onlyDevelopment: boolean;

    /**
     * Set specific guilds to use the text command
     * * Configures the text command to be usable only in the specified guilds.
     */
    guildId: ValueOrArray<string>;

    /**
     * Text Command Cooldown
     * * Sets the cooldown for the text command.
     * * * The unit is in milliseconds.
     */
    cooldown: number;

    /**
     * Text Command Permissions
     * * Sets the permissions required to use the text command.
     */
    permission: Partial<{
      /**
       * User Permissions
       * * Permissions required for users to use the text command.
       */
      user: ValueOrArray<PermissionResolvable>;

      /**
       * Bot Permissions
       * Permissions required for the bot to execute the text command.
       */
      bot: ValueOrArray<PermissionResolvable>;
    }>;

    /**
     * Text Command for Bot Administrators Only
     * * Sets the text command to be available only to bot administrators.
     * @default false
     */
    botAdmin: boolean;

    /**
     * Text Command for Bot Developers Only
     * * Sets the text command to be available only to bot developers.
     * @default false
     */
    botDeveloper: boolean;

    /**
     * Text Command for Guild Owners Only
     * * Sets the text command to be available only to guild owners.
     * @default false
     */
    guildOwner: boolean;
  }>;

  /**
   * Code to execute the text command
   * * Write the code to execute the text command.
   * @param options You can retrieve client data, message data, user locale.
   */
  run: (options: TextCommandRunOptions<InGuild>) => Promise<any>;
};

export type ExtendedTextCommnadMapKey = {
  path: string;
  functionName: string;
  commandName: string[];
  guildId?: string[];
};

export type ExtendedTextCommnadMap = Map<
  ExtendedTextCommnadMapKey,
  ExtendedTextCommandType<boolean>
>;

export class ExtendedTextCommand<InGuild extends boolean> {
  public static commands: ExtendedTextCommnadMap = new Map();

  constructor(public readonly data: ExtendedTextCommandType<InGuild>) {}

  /**
   * Initialize the text command
   * @param folders Folders to search for text commands
   */
  static async init(folders: string[] = BotConfig.TEXT_COMMAND_FOLDERS) {
    const commands = await glob(
      `${sep(__dirname)}/../{${folders.join(',')}}/**/*.{ts,js}`,
    );
    for (const path of commands) {
      const content = await import(path);
      for (const key of Object.keys(content))
        if (content[key] instanceof ExtendedTextCommand) {
          const command = content[key].data;
          this.commands.set(
            {
              path: path,
              functionName: key,
              commandName: toArray(command.name),
              guildId: command.options?.guildId
                ? toArray(command.options.guildId)
                : undefined,
            },
            command,
          );
        }
    }
  }

  static async logCommand() {
    for (const [key, command] of this.commands) {
      if (
        process.env.NODE_ENV == 'production' &&
        command?.options?.onlyDevelopment
      )
        continue;
      const namesSorted = toArray(command.name).sort(
        (a, b) => b.split(' ').length - a.split(' ').length,
      );
      for (const name of namesSorted) {
        const guildId = toArray(key.guildId ?? []);
        Log.debug(
          [
            `Added ${chalk.green(name)} Text Command for ${
              guildId.length ? chalk.cyan('Guild') : chalk.red('Global')
            } (Key : ${chalk.green(key.functionName)}, Guild : ${
              !guildId.length
                ? chalk.red('None')
                : guildId.map((v) => chalk.cyan(v)).join(', ')
            })`,
            `Location : ${chalk.yellow(key.path)}`,
          ].join('\n'),
        );
      }
    }
  }
}
