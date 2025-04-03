import chalk from 'chalk';
import fs from 'fs';

export class Log {
  private static write(type: string, content: string) {
    const date = this.date(true);
    const path = `${__dirname}/../../log`;
    for (const name of [`${type}_${date}.log`, `all_${date}.log`]) {
      if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
      fs.appendFileSync(
        `${path}/${name}`,
        content.replace(/\x1b\[[0-9;]*m/g, '') + '\n',
      );
    }
  }

  static date(only_date?: boolean) {
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

  static info(content: string, prefix?: string) {
    const result = `${this.prefix('INFO', 'green')} ${
      prefix ? prefix + ' ' : ''
    }${content.replace(/\n/g, '\n\t')}`;
    console.log(result);
    if (process.env.SAVE_LOGS == 'true') this.write('info', result);
  }

  static debug(content: string, prefix?: string) {
    const result = `${this.prefix('DEBUG', 'magenta')} ${
      prefix ? prefix + ' ' : ''
    }${content.replace(/\n/g, '\n\t')}`;
    if (process.env.NODE_ENV == 'development') console.log(result);
    if (process.env.SAVE_LOGS == 'true') this.write('debug', result);
  }

  static warn(content: string, prefix?: string) {
    const result = `${this.prefix('WARN', 'yellow')} ${
      prefix ? prefix + ' ' : ''
    }${content.replace(/\n/g, '\n\t')}`;
    console.log(result);
    if (process.env.SAVE_LOGS == 'true') this.write('warn', result);
  }

  static error(error: any, file?: string, prefix?: string) {
    const result = chalk`${this.prefix('ERROR', 'red')} ${
      prefix ? prefix + ' ' : ''
    }{red ${(error instanceof Error
      ? [
          `${error.name} - ${error.message}`,
          file ? `File : ${file}` : '',
          `Stack : ${error.stack}`,
        ]
          .filter((v) => v)
          .join('\n')
      : error
    ).replace(/\n/g, '\n\t')}}`;
    console.log(result);
    if (process.env.SAVE_LOGS == 'true') this.write('error', result);
  }
}
