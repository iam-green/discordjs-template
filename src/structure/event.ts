import { ClientEvents } from 'discord.js';
import { ExtendedClient } from './client';
import { glob } from 'glob';
import { Log, sep } from '@/common';
import chalk from 'chalk';
import { BotConfig } from '@/config';

export type ExtendedEventType<Key extends keyof ClientEvents> = {
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
     * Whether the event is only available in development
     * @default false
     */
    onlyDevelopment: boolean;
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
  ExtendedEventType<keyof ClientEvents>
>;

export class ExtendedEvent<Key extends keyof ClientEvents> {
  public static events: ExtendedEventMap = new Map();

  constructor(public readonly data: ExtendedEventType<Key>) {}

  /**
   * Initialize the event
   * @param folders Folders to search for events
   */
  static async init(folders: string[] = BotConfig.EVENT_FOLDERS) {
    const globFolders =
      folders.length < 2 ? folders[0] : `{${folders.join(',')}}`;
    const events = await glob(
      `${sep(__dirname)}/../${globFolders}/**/*.{ts,js}`,
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
