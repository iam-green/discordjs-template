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
  CommandInteractionOptionResolver,
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

export type ApplicationCommmandRunOptions<
  Type extends AllowApplicationCommandType,
  InGuild extends boolean,
> = {
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
  args: Type extends ApplicationCommandType.ChatInput
    ? CommandInteractionOptionResolver
    : undefined;
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
  description?: IsChatInput<Type, ValueOrArray<string>>;

  /**
   * Command Description for Command Parent
   * * You can add descriptions to Subcommands and Subcommand Groups.
   * * If no value is provided, the default setting will be applied.
   */
  parentDescription?: Partial<
    Record<'subcommand' | 'subcommandGroup', ValueOrArray<LocalizationMap>>
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
    onlyGuild: InGuild;

    /**
     * Whether the command is only available in development
     * @default false
     */
    onlyDevelopment: boolean;

    /**
     * Set specific guilds to use the command
     * * Configures the command to be usable only in the specified guilds.
     */
    guildId: ValueOrArray<string>;

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
       * * If defaultPermission is enabled, the first value will be registered
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
      defaultPermission: boolean;
    }>;

    /**
     * Command for Bot Administrators Only
     * * Sets the command to be available only to bot administrators.
     * @default false
     */
    botAdmin: boolean;

    /**
     * Command for Bot Developers Only
     * * Sets the command to be available only to bot developers.
     * @default false
     */
    botDeveloper: boolean;

    /**
     * Command for Guild Owners Only
     * * Sets the command to be available only to guild owners.
     * @default false
     */
    guildOwner: boolean;
  }>;

  /**
   * Code to execute the command
   * * Write the code to execute the command.
   * @param options You can retrieve client data, interaction data, and command arguments.
   */
  run: (options: ApplicationCommmandRunOptions<Type, InGuild>) => Promise<any>;

  /**
   * Code to execute the autocomplete
   * * Write the code to execute the autocomplete.
   * @param options You can retrieve client data, interaction data, and command arguments.
   */
  autocomplete?: IsChatInput<
    Type,
    (options: AutocompleteOptions<InGuild>) => Promise<any>
  >;
};

export type ExtendedApplicationCommnadMapKey = {
  path: string;
  type: AllowApplicationCommandType;
  functionName: string;
  name: string[];
  guildId?: string[];
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
  static async init(folders: string[] = BotConfig.APPLICATION_COMMAND_FOLDERS) {
    const globFolders =
      folders.length < 2 ? folders[0] : `{${folders.join(',')}}`;
    const commands = await glob(
      `${sep(__dirname)}/../${globFolders}/**/*.{ts,js}`,
    );
    for (const path of commands) {
      const content = await import(path);
      for (const key of Object.keys(content))
        if (content[key] instanceof ExtendedApplicationCommand) {
          const command = content[key].data;
          if (
            process.env.NODE_ENV == 'production' &&
            command.options?.onlyDevelopment
          )
            continue;
          this.commands.set(
            {
              path: path,
              type: command.type,
              functionName: key,
              name: toArray(command.name),
              guildId: command.options?.guildId
                ? toArray(command.options.guildId)
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
    nameArgText: string,
    nameArgIdx?: IsChatInput<Type, number>,
  ):
    | Pick<
        ApplicationCommandJSON,
        'name_localizations' | 'description_localizations'
      >
    | undefined {
    const isChatInput = type == ApplicationCommandType.ChatInput;

    const name = toArray(command.name);
    const nameLocalization = toArray(command.localization?.name ?? []);
    let descriptionLocalization = toArray(
      command.localization?.description ?? [],
    );

    if (!nameLocalization.length && !descriptionLocalization.length)
      return undefined;

    const nameIdx = name.findIndex((v) =>
      isChatInput
        ? v.split(' ')[nameArgIdx ?? 0] == nameArgText
        : v == nameArgText,
    );
    if (nameIdx < 0) return undefined;

    if (isChatInput) {
      if (name.length != nameLocalization.length)
        throw new Error(
          [
            'The number of command names and command localizations does not match.',
            `Command name : '${name.join(`', '`)}'`,
          ].join('\n'),
        );

      if (nameLocalization.length > 1 && descriptionLocalization.length == 1)
        descriptionLocalization = Array(nameLocalization.length).fill(
          descriptionLocalization[0],
        );

      if (nameLocalization.length != descriptionLocalization.length)
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
    for (const locale of Object.keys(nameLocalization[nameIdx])) {
      result.name_localizations = {
        ...result.name_localizations,
        [locale]: isChatInput
          ? nameLocalization[nameIdx][locale].split(' ')[nameArgIdx]
          : nameLocalization[nameIdx][locale],
      };
      if (isChatInput)
        result.description_localizations = {
          ...result.description_localizations,
          [locale]: descriptionLocalization[nameIdx][locale],
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
    nameArgText: string,
    nameArgIdx?: IsChatInput<Type, NameArgIdx>,
  ): Type extends ApplicationCommandType.ChatInput
    ? NameArgIdx extends 0
      ? RESTPostAPIChatInputApplicationCommandsJSONBody
      : APIApplicationCommandSubcommandOption
    : RESTPostAPIContextMenuApplicationCommandsJSONBody {
    const isChatInput = type == ApplicationCommandType.ChatInput;

    const name = toArray(command.name);
    let description = toArray(command.description ?? []);

    if (isChatInput) {
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

    const nameIdx = name.findIndex((v) =>
      isChatInput
        ? v.split(' ')[nameArgIdx ?? 0] == nameArgText
        : v == nameArgText,
    );
    if (nameIdx < 0)
      throw new Error(
        [
          'Command Name is not valid.',
          `Command Name : '${name.join(`', `)}'`,
          `Search Name : '${isChatInput ? '* ' : ''}${nameArgText}'`,
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
      nameArgText,
      nameArgIdx,
    );

    return {
      options: [],
      ...builder,
      ...localization,
      type: nameArgIdx == 0 ? type : ApplicationCommandOptionType.Subcommand,
      name: isChatInput
        ? name[nameIdx].split(' ')[nameArgIdx ?? 0]
        : name[nameIdx],
      description: isChatInput ? description[nameIdx] : undefined,
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
    nameArgText: string,
    nameArgIdx: NameArgIdx,
  ): NameArgIdx extends 0
    ? RESTPostAPIContextMenuApplicationCommandsJSONBody
    : APIApplicationCommandSubcommandGroupOption {
    const nameIdx = toArray(command.name).findIndex(
      (v) => v.split(' ')[nameArgIdx] == nameArgText,
    );
    if (nameIdx < 0)
      throw new Error(
        [
          'Command Name is not valid.',
          `Command Name : '${toArray(command.name).join(`', `)}'`,
          `Search Name : '${nameArgIdx == 0 ? '* ' : ''}${nameArgText}'`,
        ].join('\n'),
      );

    const name = toArray(command.name)[nameIdx];
    const nameArg = name.split(' ');

    const parentDescriptionArg = (locale: Locale) =>
      toArray(
        command.parentDescription?.[
          nameArgIdx == 0 ? 'subcommand' : 'subcommandGroup'
        ] ?? [],
      )?.[nameIdx]?.[locale];

    const nameLocalizationArg = (locale: Locale) =>
      toArray(command.localization?.name ?? [])?.[nameIdx]?.[locale]?.split(
        ' ',
      );

    const descriptionLocalizations: LocalizationMap = Language.locales().reduce(
      (cur, acc) => ({
        ...cur,
        [acc]:
          parentDescriptionArg(acc) ??
          Language.get(
            acc,
            nameArgIdx == 0
              ? 'Subcommand_Description'
              : 'SubcommandGroup_Description',
            nameLocalizationArg(acc)?.[0] ?? nameArg[0],
            nameLocalizationArg(acc)?.[1] ?? nameArg[1],
          ),
      }),
      {},
    );

    return {
      type:
        nameArgIdx == 0
          ? ApplicationCommandType.ChatInput
          : ApplicationCommandOptionType.SubcommandGroup,
      ...this.getCommandLocalization(
        command.type,
        command,
        nameArg[nameArgIdx],
        nameArgIdx,
      ),
      name: nameArg[nameArgIdx],
      description: descriptionLocalizations[BotConfig.DEFAULT_LANGUAGE],
      description_localizations: descriptionLocalizations,
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
      const namesSorted = toArray(command.name).sort(
        (a, b) => b.split(' ').length - a.split(' ').length,
      );
      for (const name of namesSorted) {
        const nameArg = name.split(' ');

        const singleCommand = this.convertSingleCommand(
          command.type,
          command,
          nameArg[nameArg.length - 1],
          command.type == ApplicationCommandType.ChatInput
            ? ((nameArg.length - 1) as 0 | 1 | 2)
            : undefined,
        );

        if (command.type != ApplicationCommandType.ChatInput)
          result.push(
            singleCommand as RESTPostAPIContextMenuApplicationCommandsJSONBody,
          );
        else {
          if (nameArg.length > 1 && !result.find((v) => v.name == nameArg[0]))
            result.push(this.convertCommandParent(command, nameArg[0], 0));

          if (
            nameArg.length > 2 &&
            !result.find(
              (v) =>
                v.name == nameArg[0] &&
                v.options?.find((v) => v.name == nameArg[1]),
            )
          )
            result
              .find((v) => v.name == nameArg[0])
              ?.options?.push(
                this.convertCommandParent(command, nameArg[1], 1),
              );

          if (nameArg.length == 1)
            result.push(
              singleCommand as RESTPostAPIChatInputApplicationCommandsJSONBody,
            );
          else if (nameArg.length == 2)
            result
              .find((v) => v.name == nameArg[0])
              ?.options?.push(
                singleCommand as APIApplicationCommandSubcommandOption,
              );
          else {
            const group = result
              .find((v) => v.name == nameArg[0])
              ?.options?.find((v) => v.name == nameArg[1]);
            if (group && 'options' in group)
              group.options?.push(singleCommand as any);
          }
        }
      }
    }

    return result;
  }

  static async logCommand() {
    for (const [key, command] of this.commands) {
      const namesSorted = toArray(command.name).sort(
        (a, b) => b.split(' ').length - a.split(' ').length,
      );
      for (const name of namesSorted) {
        const guildId = toArray(key.guildId ?? []);
        Log.debug(
          [
            `Added ${chalk.green(name)} ${
              command.type == ApplicationCommandType.ChatInput
                ? 'Chat Input'
                : 'Context Menu'
            } for ${
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

  static async registerCommand() {
    if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN is missing');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const commandFiltered = new Map(
      [...this.commands].filter(([k]) => !k.guildId),
    );
    const command = this.convertCommand(commandFiltered);
    await rest.put(Routes.applicationCommands(DiscordUtil.clientId), {
      body: command,
    });
  }

  static async registerGuildCommand() {
    if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN is missing');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const commandFiltered = new Map(
      [...this.commands].filter(([k]) => k.guildId),
    );
    const guildCommand: Map<string, ExtendedApplicationCommnadMap> = new Map();
    for (const [k, v] of commandFiltered)
      for (const id of k.guildId ?? []) {
        if (!guildCommand.has(id)) guildCommand.set(id, new Map());
        guildCommand.get(id)?.set(k, v);
      }
    for (const [guildId, command] of guildCommand)
      await rest.put(
        Routes.applicationGuildCommands(DiscordUtil.clientId, guildId),
        {
          body: this.convertCommand(command),
        },
      );
  }
}
