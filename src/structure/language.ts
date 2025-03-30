import { sep } from '@/common';
import { BotConfig } from '@/config';
import { Locale } from 'discord.js';
import { glob } from 'glob';

export type LanguageData = typeof import('../languages/en-US.json');

export class Language {
  private static locale: Locale[] = [];
  private static data: Map<Partial<Locale>, LanguageData> = new Map();

  static locales(include_default: boolean = true) {
    if (!this.locale.length)
      this.locale = glob
        .sync(`${sep(__dirname)}/../languages/*.json`)
        .map((path) => path.match(/languages\/(.*?)\.json$/)?.[1]) as Locale[];

    return this.locale.filter(
      (v) => include_default || v != BotConfig.DEFAULT_LANGUAGE,
    );
  }

  static async init() {
    const locale_list = Object.values(Locale).map((v) => v.toString());
    for (const locale of this.locales())
      if (locale_list.includes(locale))
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
}
