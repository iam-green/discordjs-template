import { ClientEvents, PermissionResolvable } from 'discord.js';
import { ExtendedClient } from './client';
import { glob } from 'glob';
import { Log, sep, ValueOrArray } from '@/common';
import chalk from 'chalk';
import { BotConfig } from '@/config';

export type ExtendedEventType<
  Key extends keyof ClientEvents,
  InGuild extends boolean,
> = {
  /**
   * Discord Event Type
   */
  event: Key;

  /**
   * Whether the component is single-use
   */
  once?: boolean;

  /**
   * Event Options
   * * You can set desired options for the event.
   */
  options?: Partial<{
    /**
     * Whether the event is only available in guilds
     * * If you enable this option, you can import guild-related information.
     * @default false
     */
    onlyGuild: InGuild;

    /**
     * Whether the event is only available in development
     * @default false
     */
    onlyDevelopment: boolean;

    /**
     * Set specific guilds to use the event
     * * Configures the event to be usable only in the specified guilds.
     */
    guildId: ValueOrArray<string>;

    /**
     * Event Permissions
     * * Sets the permissions required to use the event.
     */
    permission: Partial<{
      /**
       * User Permissions
       * * Permissions required for users to use the event.
       * * If default_permission is enabled, the first value will be registered
       *   as the default permission for the slash event.
       */
      user: ValueOrArray<PermissionResolvable>;

      /**
       * Bot Permissions
       * Permissions required for the bot to execute the event.
       */
      bot: ValueOrArray<PermissionResolvable>;
    }>;

    /**
     * Event for Bot Administrators Only
     * * Sets the event to be available only to bot administrators.
     * @default false
     */
    botAdmin: boolean;

    /**
     * Event for Bot Developers Only
     * * Sets the event to be available only to bot developers.
     * @default false
     */
    botDeveloper: boolean;

    /**
     * Event for Guild Owners Only
     * * Sets the event to be available only to guild owners.
     * @default false
     */
    guildOwner: boolean;
  }>;

  /**
   * Code to execute the event.
   * * Write the code to execute the event.
   * @param client You can retrieve client data.
   * @param args You can retrieve arguments corresponding to the client event.
   */
  run: (client: ExtendedClient, ...args: ClientEvents[Key]) => Promise<any>;
};

export type ExtendedEventMapKey = {
  path: string;
  functionName: string;
};

export type ExtendedEventMap = Map<
  ExtendedEventMapKey,
  ExtendedEventType<keyof ClientEvents, boolean>
>;

export class ExtendedEvent<
  Key extends keyof ClientEvents,
  InGuild extends boolean,
> {
  public static events: ExtendedEventMap = new Map();

  constructor(public readonly data: ExtendedEventType<Key, InGuild>) {}

  /**
   * Initialize the event
   * @param folders Folders to search for events
   */
  static async init(folders: string[] = BotConfig.EVENT_FOLDERS) {
    const events = await glob(
      `${sep(__dirname)}/../{${folders.join(',')}}/**/*{.ts,.js}`,
    );
    for (const path of events) {
      const content = await import(path);
      for (const key of Object.keys(content))
        if (content[key] instanceof ExtendedEvent)
          if (
            process.env.NODE_ENV != 'production' ||
            !content[key].data.options?.onlyDevelopment
          )
            this.events.set({ path, functionName: key }, content[key].data);
    }
  }

  static async logEvents() {
    for (const [{ path, functionName }, { event }] of this.events)
      Log.debug(
        [
          `Added ${chalk.green(event)} Event (Key : ${chalk.green(functionName)})`,
          `Location : ${chalk.yellow(path)})`,
        ].join('\n'),
      );
  }
}
