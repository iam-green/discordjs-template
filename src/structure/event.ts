import { ClientEvents } from 'discord.js';
import { ExtendedClient } from './client';
import { glob } from 'glob';
import { Log, sep } from '@/common';
import chalk from 'chalk';

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
   * Code to execute the event.
   * * Write the code to execute the event.
   * @param client You can retrieve client data.
   * @param args You can retrieve arguments corresponding to the client event.
   */
  run: (client: ExtendedClient, ...args: ClientEvents[Key]) => void;
};

export type ExtendedEventMapKey = {
  path: string;
  function_name: string;
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
  static async init(folders: string[] = ['event', 'events']) {
    const events = await glob(
      `${sep(__dirname)}/../{${folders.join(',')}}/**/*{.ts,.js}`,
    );
    for (const path of events) {
      const content = await import(path);
      for (const key of Object.keys(content))
        if (content[key] instanceof ExtendedEvent)
          this.events.set({ path, function_name: key }, content[key].data);
    }
  }

  static async logEvents() {
    for (const [{ path, function_name }, { event }] of this.events)
      Log.debug(
        [
          `Added ${chalk.green(event)} Event (Key : ${chalk.green(function_name)})`,
          `Location : ${chalk.yellow(path)})`,
        ].join('\n'),
      );
  }
}
