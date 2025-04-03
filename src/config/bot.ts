import { ClientOptions, GatewayIntentBits, Locale, Options } from 'discord.js';

export const BotConfig = {
  NAME: 'Template',
  COMMAND_PREFIX: ['/', '?', '!', '?!'],
  DEFAULT_LANGUAGE: 'en-US' as Locale,
  CLIENT_OPTION: {
    intents: [
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
    ],
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: { interval: 3600, lifetime: 1800 },
      users: {
        interval: 3600,
        filter: () => (user) => user.bot && user.id != user.client.user.id,
      },
    },
  } as ClientOptions,
  APPLICATION_COMMAND_FOLDERS: ['command', 'context', 'commands', 'contexts'],
  COMPONENT_FOLDERS: ['component', 'components'],
  TEXT_COMMAND_FOLDERS: [
    'text_command',
    'text_commands',
    'textcommand',
    'textcommands',
  ],
  EVENT_FOLDERS: ['event', 'events'],
};
