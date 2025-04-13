import {
  DiscordUtil,
  GuildInteraction,
  Log,
  sep,
  toArray,
  ValueOrArray,
} from '@/common';
import {
  APIApplicationCommand,
  ApplicationCommandType,
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  LocalizationMap,
  MessageContextMenuCommandInteraction,
  SlashCommandSubcommandBuilder,
  UserContextMenuCommandInteraction,
  PermissionResolvable,
  ApplicationCommandOptionType,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
  APIApplicationCommandSubcommandOption,
  APIApplicationCommandSubcommandGroupOption,
  REST,
  Routes,
  Locale,
} from 'discord.js';
import { ExtendedClient } from './client';
import { glob } from 'glob';
import chalk from 'chalk';
import { Language } from './language';
import { BotConfig } from '@/config';

export type AllowApplicationCommandType =
  | ApplicationCommandType.ChatInput
  | ApplicationCommandType.Message
  | ApplicationCommandType.User;

export type IsChatInput<
  T extends AllowApplicationCommandType,
  Value,
> = T extends ApplicationCommandType.ChatInput ? Value : undefined;

export type ApplicationCommandJSON = Omit<
  APIApplicationCommand,
  | 'id'
  | 'type'
  | 'description'
  | 'application_id'
  | 'version'
  | 'default_member_permissions'
  | 'default_permission'
> &
  Partial<
    Pick<
      APIApplicationCommand,
      'description' | 'default_member_permissions' | 'default_permission'
    >
  >;

export type ApplicationCommnadBuilder =
  | Omit<
      ApplicationCommandJSON,
      | 'name'
      | 'name_localizations'
      | 'description'
      | 'description_localizations'
    >
  | ((builder: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder);

export type ApplicationCommandInteraction<
  Type extends AllowApplicationCommandType,
  InGuild extends boolean,
> = GuildInteraction<
  Type extends ApplicationCommandType.User
    ? UserContextMenuCommandInteraction<CacheType>
    : Type extends ApplicationCommandType.Message
      ? MessageContextMenuCommandInteraction<CacheType>
      : ChatInputCommandInteraction<CacheType>,
  InGuild
>;

export type ApplicationCommandsJSONBody =
  | RESTPostAPIChatInputApplicationCommandsJSONBody
  | RESTPostAPIContextMenuApplicationCommandsJSONBody;

export type ApplicationCommmandRunOptions<InGuild extends boolean> = {
  /**
   * Discord Client
   */
  client: ExtendedClient;

  /**
   * Interaction Data
   */
  interaction: ApplicationCommandInteraction<
    AllowApplicationCommandType,
    InGuild
  >;

  /**
   * Command Arguments
   */
  args: ApplicationCommandInteraction<
    AllowApplicationCommandType,
    InGuild
  >['options'];
};

export type AutocompleteOptions<InGuild extends boolean> = {
  /**
   * Discord Client
   */
  client: ExtendedClient;

  /**
   * Interaction Data
   */
  interaction: GuildInteraction<AutocompleteInteraction, InGuild>;

  /**
   * Command Arguments
   */
  args: GuildInteraction<AutocompleteInteraction, InGuild>['options'];
};

export type ExtendedApplicationCommnadType<
  Type extends AllowApplicationCommandType,
  InGuild extends boolean,
> = {
  /**
   * Discord Application Command Type
   */
  type: Type;

  /**
   * Command Name
   * * By using an array, you can create a command with multiple names.
   * * Automatically generates subcommand groups and subcommands based on the spacing in the command name.
   * @example 'ping'
   * @example 'setting prefix'
   * @example ['ping', 'p']
   * @example ['setting prefix', 's p']
   */
  name: ValueOrArray<string>;

  /**
   * Command Description
   * * By using an array, you can create a command with multiple descriptions.
   * If you use a single description, the same description will be applied to all names.
   * @example 'Ping Command'
   * @example ['Ping Command', 'Pong Command']
   */
  description: IsChatInput<Type, ValueOrArray<string>>;

  /**
   * Command Description for Command Parent
   * * You can add descriptions to Subcommands and Subcommand Groups.
   * * If no value is provided, the default setting will be applied.
   */
  parent_description?: Partial<
    Record<'subcommand' | 'subcommand_group', ValueOrArray<LocalizationMap>>
  >;

  /**
   * Command Localization
   * * You can set the name and description of the command in multiple languages.
   * @example { name: { ko: '핑' }, description: { ko: '핑을 보내는 명령어입니다.' } }
   * @example { name: { 'en-US': 'ping' }, description: { 'en-US': 'Command to send ping.' } }
   * @example [{ name: { ko: '핑' }, description: { ko: '핑을 보내는 명령어입니다.' } }, { name: { 'en-US': 'ping' }, description: { 'en-US': 'Command to send ping.' } }]
   */
  localization?: Partial<
    Record<'name' | 'description', ValueOrArray<LocalizationMap>>
  >;

  /**
   * Command Builder
   * * You can configure various options for the command using the command builder.
   * * Supports both JSON format and SlashCommandSubcommandBuilder.
   */
  command?: ApplicationCommnadBuilder;

  /**
   * Command Options
   * * You can set desired options for the command.
   */
  options?: Partial<{
    /**
     * Whether the command is only available in guilds
     * * If you enable this option, you can import guild-related information.
     * @default false
     */
    only_guild: InGuild;

    /**
     * Whether the command is only available in development
     * @default false
     */
    only_development: boolean;

    /**
     * Set specific guilds to use the command
     * * Configures the command to be usable only in the specified guilds.
     */
    guild_id: ValueOrArray<string>;

    /**
     * Command Cooldown
     * * Sets the cooldown for the command.
     * * * The unit is in milliseconds.
     */
    cooldown: number;

    /**
     * Command Permissions
     * * Sets the permissions required to use the command.
     */
    permission: Partial<{
      /**
       * User Permissions
       * * Permissions required for users to use the command.
       * * If default_permission is enabled, the first value will be registered
       *   as the default permission for the slash command.
       */
      user: ValueOrArray<PermissionResolvable>;

      /**
       * Bot Permissions
       * Permissions required for the bot to execute the command.
       */
      bot: ValueOrArray<PermissionResolvable>;

      /**
       * Set Default Permissions
       * * Default permissions are registered for slash commands.
       * * Allowing only users with the specified permissions or higher to use the command.
       */
      default_permission: boolean;
    }>;

    /**
     * Command for Bot Administrators Only
     * * Sets the command to be available only to bot administrators.
     * @default false
     */
    bot_admin: boolean;

    /**
     * Command for Bot Developers Only
     * * Sets the command to be available only to bot developers.
     * @default false
     */
    bot_developer: boolean;

    /**
     * Command for Guild Owners Only
     * * Sets the command to be available only to guild owners.
     * @default false
     */
    guild_owner: boolean;
  }>;

  /**
   * Code to execute the command
   * * Write the code to execute the command.
   * @param options You can retrieve client data, interaction data, and command arguments.
   */
  run: (options: ApplicationCommmandRunOptions<InGuild>) => Promise<void>;

  /**
   * Code to execute the autocomplete
   * * Write the code to execute the autocomplete.
   * @param options You can retrieve client data, interaction data, and command arguments.
   */
  autocomplete?: IsChatInput<
    Type,
    (options: AutocompleteOptions<InGuild>) => Promise<void>
  >;
};

export type ExtendedApplicationCommnadMapKey = {
  path: string;
  type: AllowApplicationCommandType;
  function_name: string;
  name: string[];
  guild_id?: string[];
};

export type ExtendedApplicationCommnadMap = Map<
  ExtendedApplicationCommnadMapKey,
  ExtendedApplicationCommnadType<AllowApplicationCommandType, boolean>
>;

export class ExtendedApplicationCommand<
  Type extends AllowApplicationCommandType,
  InGuild extends boolean,
> {
  public static commands: ExtendedApplicationCommnadMap = new Map();

  constructor(
    public readonly data: ExtendedApplicationCommnadType<Type, InGuild>,
  ) {}

  /**
   * Initialize the command
   * @param folders Folders to search for commands
   */
  static async init(
    folders: string[] = ['command', 'context', 'commands', 'contexts'],
  ) {
    const commands = await glob(
      `${sep(__dirname)}/../{${folders.join(',')}}/**/*.{ts,js}`,
    );
    for (const path of commands) {
      const content = await import(path);
      for (const key of Object.keys(content))
        if (content[key] instanceof ExtendedApplicationCommand) {
          const command = content[key].data;
          if (
            process.env.NODE_ENV == 'production' &&
            command.options?.only_development
          )
            continue;
          this.commands.set(
            {
              path: path,
              type: command.type,
              function_name: key,
              name: toArray(command.name),
              guild_id: command.options?.guild_id
                ? toArray(command.options.guild_id)
                : undefined,
            },
            command,
          );
        }
    }
  }

  private static getCommandLocalization<
    Type extends AllowApplicationCommandType,
  >(
    type: Type,
    command: ExtendedApplicationCommnadType<Type, boolean>,
    name_arg_text: string,
    name_arg_idx?: IsChatInput<Type, number>,
  ):
    | Pick<
        ApplicationCommandJSON,
        'name_localizations' | 'description_localizations'
      >
    | undefined {
    const is_chat_input = type == ApplicationCommandType.ChatInput;

    const name = toArray(command.name);
    const name_localization = toArray(command.localization?.name ?? []);
    let description_localization = toArray(
      command.localization?.description ?? [],
    );

    if (!name_localization.length && !description_localization.length)
      return undefined;

    const name_idx = name.findIndex((v) =>
      is_chat_input
        ? v.split(' ')[name_arg_idx ?? 0] == name_arg_text
        : v == name_arg_text,
    );
    if (name_idx < 0) return undefined;

    if (is_chat_input) {
      if (name.length != name_localization.length)
        throw new Error(
          [
            'The number of command names and command localizations does not match.',
            `Command name : '${name.join(`', '`)}'`,
          ].join('\n'),
        );

      if (name_localization.length > 1 && description_localization.length == 1)
        description_localization = Array(name_localization.length).fill(
          description_localization[0],
        );

      if (name_localization.length != description_localization.length)
        throw new Error(
          [
            'The number of command name localizations and command description localizations does not match.',
            `Command name : '${name.join(`', '`)}'`,
          ].join('\n'),
        );
    }

    const result: Pick<
      ApplicationCommandJSON,
      'name_localizations' | 'description_localizations'
    > = {};
    for (const locale of Object.keys(name_localization[name_idx])) {
      result.name_localizations = {
        ...result.name_localizations,
        [locale]: is_chat_input
          ? name_localization[name_idx][locale].split(' ')[name_arg_idx]
          : name_localization[name_idx][locale],
      };
      if (is_chat_input)
        result.description_localizations = {
          ...result.description_localizations,
          [locale]: description_localization[name_idx][locale],
        };
    }
    return result;
  }

  private static convertSingleCommand<
    Type extends AllowApplicationCommandType,
    NameArgIdx extends 0 | 1 | 2,
  >(
    type: Type,
    command: ExtendedApplicationCommnadType<Type, boolean>,
    name_arg_text: string,
    name_arg_idx?: IsChatInput<Type, NameArgIdx>,
  ): Type extends ApplicationCommandType.ChatInput
    ? NameArgIdx extends 0
      ? RESTPostAPIChatInputApplicationCommandsJSONBody
      : APIApplicationCommandSubcommandOption
    : RESTPostAPIContextMenuApplicationCommandsJSONBody {
    const is_chat_input = type == ApplicationCommandType.ChatInput;

    const name = toArray(command.name);
    let description = toArray(command.description ?? []);

    if (is_chat_input) {
      if (name.length > 1 && description.length == 1)
        description = Array(name.length).fill(description[0]);

      if (name.length != description.length)
        throw new Error(
          [
            'The number of command names and descriptions does not match.',
            `Command name : '${name.join(`', '`)}'`,
          ].join('\n'),
        );
    }

    const name_idx = name.findIndex((v) =>
      is_chat_input
        ? v.split(' ')[name_arg_idx ?? 0] == name_arg_text
        : v == name_arg_text,
    );
    if (name_idx < 0)
      throw new Error(
        [
          'Command Name is not valid.',
          `Command Name : '${name.join(`', `)}'`,
          `Search Name : '${is_chat_input ? '* ' : ''}${name_arg_text}'`,
        ].join('\n'),
      );

    const dummy = new SlashCommandSubcommandBuilder()
      .setName('dummy')
      .setDescription('dummy');

    const builder =
      command.command instanceof Function
        ? command.command(dummy).toJSON()
        : command.command;

    const localization = this.getCommandLocalization(
      type,
      command,
      name_arg_text,
      name_arg_idx,
    );

    return {
      options: [],
      ...builder,
      ...localization,
      type: name_arg_idx == 0 ? type : ApplicationCommandOptionType.Subcommand,
      name: is_chat_input
        ? name[name_idx].split(' ')[name_arg_idx ?? 0]
        : name[name_idx],
      description: is_chat_input ? description[name_idx] : undefined,
    } as Type extends ApplicationCommandType.ChatInput
      ? NameArgIdx extends 0
        ? RESTPostAPIChatInputApplicationCommandsJSONBody
        : APIApplicationCommandSubcommandOption
      : RESTPostAPIContextMenuApplicationCommandsJSONBody;
  }

  private static convertCommandParent<NameArgIdx extends 0 | 1>(
    command: ExtendedApplicationCommnadType<
      AllowApplicationCommandType,
      boolean
    >,
    name_arg_text: string,
    name_arg_idx: NameArgIdx,
  ): NameArgIdx extends 0
    ? RESTPostAPIContextMenuApplicationCommandsJSONBody
    : APIApplicationCommandSubcommandGroupOption {
    const name_idx = toArray(command.name).findIndex(
      (v) => v.split(' ')[name_arg_idx] == name_arg_text,
    );
    if (name_idx < 0)
      throw new Error(
        [
          'Command Name is not valid.',
          `Command Name : '${toArray(command.name).join(`', `)}'`,
          `Search Name : '${name_arg_idx == 0 ? '* ' : ''}${name_arg_text}'`,
        ].join('\n'),
      );

    const name = toArray(command.name)[name_idx];
    const name_arg = name.split(' ');

    const parent_description_arg = (locale: Locale) =>
      toArray(
        command.parent_description?.[
          name_arg_idx == 0 ? 'subcommand' : 'subcommand_group'
        ] ?? [],
      )?.[name_idx]?.[locale];

    const name_localization_arg = (locale: Locale) =>
      toArray(command.localization?.name ?? [])?.[name_idx]?.[locale]?.split(
        ' ',
      );

    const description_localizations: LocalizationMap =
      Language.locales().reduce(
        (cur, acc) => ({
          ...cur,
          [acc]:
            parent_description_arg(acc) ??
            Language.get(
              acc,
              name_arg_idx == 0
                ? 'Subcommand_Description'
                : 'SubcommandGroup_Description',
              name_localization_arg(acc)?.[0] ?? name_arg[0],
              name_localization_arg(acc)?.[1] ?? name_arg[1],
            ),
        }),
        {},
      );

    return {
      type:
        name_arg_idx == 0
          ? ApplicationCommandType.ChatInput
          : ApplicationCommandOptionType.SubcommandGroup,
      ...this.getCommandLocalization(
        command.type,
        command,
        name_arg[name_arg_idx],
        name_arg_idx,
      ),
      name: name_arg[name_arg_idx],
      description: description_localizations[BotConfig.DEFAULT_LANGUAGE],
      description_localizations,
      options: [],
    } as unknown as NameArgIdx extends 0
      ? RESTPostAPIContextMenuApplicationCommandsJSONBody
      : APIApplicationCommandSubcommandGroupOption;
  }

  static convertCommand(
    commands: ExtendedApplicationCommnadMap,
  ): ApplicationCommandsJSONBody[] {
    const result: ApplicationCommandsJSONBody[] = [];

    for (const command of commands.values()) {
      const names_sorted = toArray(command.name).sort(
        (a, b) => b.split(' ').length - a.split(' ').length,
      );
      for (const name of names_sorted) {
        const name_arg = name.split(' ');

        const single_command = this.convertSingleCommand(
          command.type,
          command,
          name_arg[name_arg.length - 1],
          command.type == ApplicationCommandType.ChatInput
            ? ((name_arg.length - 1) as 0 | 1 | 2)
            : undefined,
        );

        if (command.type != ApplicationCommandType.ChatInput)
          result.push(
            single_command as RESTPostAPIContextMenuApplicationCommandsJSONBody,
          );
        else {
          if (name_arg.length > 1 && !result.find((v) => v.name == name_arg[0]))
            result.push(this.convertCommandParent(command, name_arg[0], 0));

          if (
            name_arg.length > 2 &&
            !result.find(
              (v) =>
                v.name == name_arg[0] &&
                v.options?.find((v) => v.name == name_arg[1]),
            )
          )
            result
              .find((v) => v.name == name_arg[0])
              ?.options?.push(
                this.convertCommandParent(command, name_arg[1], 1),
              );

          if (name_arg.length == 1)
            result.push(
              single_command as RESTPostAPIChatInputApplicationCommandsJSONBody,
            );
          else if (name_arg.length == 2)
            result
              .find((v) => v.name == name_arg[0])
              ?.options?.push(
                single_command as APIApplicationCommandSubcommandOption,
              );
          else {
            const group = result
              .find((v) => v.name == name_arg[0])
              ?.options?.find((v) => v.name == name_arg[1]);
            if (group && 'options' in group)
              group.options?.push(single_command as any);
          }
        }
      }
    }

    return result;
  }

  static async logCommand() {
    for (const [key, command] of this.commands) {
      const names_sorted = toArray(command.name).sort(
        (a, b) => b.split(' ').length - a.split(' ').length,
      );
      for (const name of names_sorted) {
        const guild_id = toArray(key.guild_id ?? []);
        Log.debug(
          [
            `Added ${chalk.green(name)} ${
              command.type == ApplicationCommandType.ChatInput
                ? 'Chat Input'
                : 'Context Menu'
            } for ${
              guild_id.length ? chalk.cyan('Guild') : chalk.red('Global')
            } (Key : ${chalk.green(key.function_name)}, Guild : ${
              !guild_id.length
                ? chalk.red('None')
                : guild_id.map((v) => chalk.cyan(v)).join(', ')
            })`,
            `Location : ${chalk.yellow(key.path)}`,
          ].join('\n'),
        );
      }
    }
  }

  static async registerCommand() {
    if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN is missing');;
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const command_filtered = new Map(
      [...this.commands].filter(([k]) => !k.guild_id),
    );
    const command = this.convertCommand(command_filtered);
    await rest.put(Routes.applicationCommands(DiscordUtil.client_id), {
      body: command,
    });
  }

  static async registerGuildCommand() {
    if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN is missing');;
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const command_filtered = new Map(
      [...this.commands].filter(([k]) => k.guild_id),
    );
    const guild_command: Map<string, ExtendedApplicationCommnadMap> = new Map();
    for (const [k, v] of command_filtered)
      for (const id of k.guild_id ?? []) {
        if (!guild_command.has(id)) guild_command.set(id, new Map());
        guild_command.get(id)?.set(k, v);
      }
    for (const [guild_id, command] of guild_command)
      await rest.put(
        Routes.applicationGuildCommands(DiscordUtil.client_id, guild_id),
        {
          body: this.convertCommand(command),
        },
      );
  }
}
