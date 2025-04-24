import { sep } from '@/common';
import { BotConfig } from '@/config';
import {
  ApplicationCommandType,
  Locale,
  SharedNameAndDescription,
  SlashCommandStringOption,
} from 'discord.js';
import { glob } from 'glob';
import { ExtendedApplicationCommnadType } from './applicationCommand';

export type LanguageData = typeof import('../languages/en-US.json');

export class Language {
  private static locale: Locale[] = [];
  private static data: Map<Partial<Locale>, LanguageData> = new Map();

  static locales(includeDefault: boolean = true) {
    if (!this.locale.length)
      this.locale = glob
        .sync(`${sep(__dirname)}/../languages/*.json`)
        .map((path) => path.match(/languages\/(.*?)\.json$/)?.[1]) as Locale[];

    return this.locale.filter(
      (v) => includeDefault || v != BotConfig.DEFAULT_LANGUAGE,
    );
  }

  static async init() {
    const localeList = Object.values(Locale).map((v) => v.toString());
    for (const locale of this.locales())
      if (localeList.includes(locale))
        this.data.set(
          locale,
          (await import(`../languages/${locale}.json`)).default,
        );
  }

  static get(locale: Locale, data: keyof LanguageData, ...format: any[]) {
    if (!this.data.size) return '';
    const result =
      this.data.get(locale)?.[data] ??
      this.data.get(BotConfig.DEFAULT_LANGUAGE)?.[data] ??
      '';
    if (!/{(\d+)}/g.test(result)) return result;
    return result.replace(/{(\d+)}/g, (match, number) => {
      return typeof format[number] != 'undefined' ? format[number] : match;
    });
  }

  static command(
    name: string,
  ): Pick<
    ExtendedApplicationCommnadType<ApplicationCommandType.ChatInput, boolean>,
    'name' | 'description' | 'localization'
  > {
    return {
      name: Language.get(
        BotConfig.DEFAULT_LANGUAGE,
        `Command_${name}_Name` as keyof LanguageData,
      ),
      description: Language.get(
        BotConfig.DEFAULT_LANGUAGE,
        `Command_${name}_Description` as keyof LanguageData,
      ),
      localization: {
        name: Language.locales()
          .map((v) => ({
            [v]: Language.get(v, `Command_${name}_Name` as keyof LanguageData),
          }))
          .reduce((a, b) => ({ ...a, ...b })),
        description: Language.locales()
          .map((v) => ({
            [v]: Language.get(
              v,
              `Command_${name}_Description` as keyof LanguageData,
            ),
          }))
          .reduce((a, b) => ({ ...a, ...b })),
      },
    };
  }

  static commandOption<T extends SharedNameAndDescription>(
    commandName: string,
    commandOption: string,
    option: T,
  ): T {
    return option
      .setName(
        Language.get(
          BotConfig.DEFAULT_LANGUAGE,
          `Command_${commandName}_Option_${commandOption}_Name` as keyof LanguageData,
        ),
      )
      .setDescription(
        Language.get(
          BotConfig.DEFAULT_LANGUAGE,
          `Command_${commandName}_Option_${commandOption}_Description` as keyof LanguageData,
        ),
      )
      .setNameLocalizations(
        Language.locales()
          .map((v) => ({
            [v]: Language.get(
              v,
              `Command_${commandName}_Option_${commandOption}_Name` as keyof LanguageData,
            ),
          }))
          .reduce((a, b) => ({ ...a, ...b })),
      )
      .setDescriptionLocalizations(
        Language.locales()
          .map((v) => ({
            [v]: Language.get(
              v,
              `Command_${commandName}_Option_${commandOption}_Description` as keyof LanguageData,
            ),
          }))
          .reduce((a, b) => ({ ...a, ...b })),
      );
  }

  static commandOptionChoice(
    commandName: string,
    commandOption: string,
    commandChoice: string[],
    option: SlashCommandStringOption,
  ) {
    return this.commandOption(commandName, commandOption, option).addChoices(
      commandChoice.map((v) => ({
        name: Language.get(
          BotConfig.DEFAULT_LANGUAGE,
          `Command_${commandName}_Option_${commandOption}_Choice_${v}` as keyof LanguageData,
        ),
        value: v,
        name_localizations: Language.locales()
          .map((w) => ({
            [w]: Language.get(
              w,
              `Command_${commandName}_Option_${commandOption}_Choice_${v}` as keyof LanguageData,
            ),
          }))
          .reduce((a, b) => ({ ...a, ...b })),
      })),
    );
  }
}
