import chalk from 'chalk';
import fs from 'fs';

export class Log {
  private static write(type: string, ...content: any[]) {
    const date = this.date(true);
    const path = `${__dirname}/../../../logs`;
    for (const name of [`${type}_${date}.log`, `all_${date}.log`]) {
      if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
      fs.appendFileSync(
        path + '/' + name,
        content
          .map(String)
          .join(' ')
          .replace(/\x1b\[[0-9;]*m/g, '') + '\n',
      );
    }
  }

  private static date(only_date?: boolean) {
    const date = new Date();
    const year = date.getFullYear().toString().padStart(4, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    return only_date
      ? `${year}-${month}-${day}`
      : `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  static prefix(type: string, color: string) {
    return chalk`{cyan [}{${color} ${type}}{cyan ]} {cyan (}{yellow ${this.date()}}{cyan )}`;
  }

  static info(...content: any[]) {
    const result = [
      this.prefix('INFO', 'green'),
      ...content.map((v) =>
        typeof v == 'string' ? v.replace(/\n/g, '\n\t') : v,
      ),
    ];
    console.log(...result);
    if (process.env.SAVE_LOGS == 'true') this.write('info', ...result);
  }

  static debug(...content: any[]) {
    const result = [
      this.prefix('DEBUG', 'magenta'),
      ...content.map((v) =>
        typeof v == 'string' ? v.replace(/\n/g, '\n\t') : v,
      ),
    ];
    if (process.env.NODE_ENV == 'development') console.log(...result);
    if (process.env.SAVE_LOGS == 'true') this.write('debug', ...result);
  }

  static warn(...content: any[]) {
    const result = [
      this.prefix('WARN', 'yellow'),
      ...content.map((v) =>
        typeof v == 'string' ? v.replace(/\n/g, '\n\t') : v,
      ),
    ];
    console.warn(...result);
    if (process.env.SAVE_LOGS == 'true') this.write('warn', ...result);
  }

  static error(...content: any[]) {
    const result = [
      this.prefix('ERROR', 'red'),
      ...content.map((v, i) =>
        v instanceof Error
          ? chalk.red(
              [
                v.name + ' - ' + v.message,
                'Stack : ' + v.stack?.replace(/\n/g, '\n\t'),
              ].join('\n\t'),
            ) + (content.length - 1 > i ? '\n' : '')
          : typeof v == 'string'
            ? chalk.red(v.replace(/\n/g, '\n\t'))
            : v,
      ),
    ];
    console.error(...result);
    if (process.env.SAVE_LOGS == 'true') this.write('error', ...result);
  }
}
