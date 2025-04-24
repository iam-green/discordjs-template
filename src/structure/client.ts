import chalk from 'chalk';
import { ClusterClient } from 'discord-hybrid-sharding';
import {
  ApplicationCommandType,
  BaseMessageOptions,
  ChannelType,
  Client,
  ClientOptions,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  Events,
  Interaction,
  InteractionReplyOptions,
  Locale,
  Message,
  MessageFlags,
  PermissionFlagsBits,
  PermissionResolvable,
} from 'discord.js';
import { Language, LanguageData } from './language';
import { ExtendedEvent } from './event';
import { ExtendedComponent } from './component';
import { ExtendedTextCommand } from './textCommand';
import { ExtendedApplicationCommand } from './applicationCommand';
import { DiscordUtil, Log, toArray, ValueOrArray } from '@/common';
import { BotConfig, EmbedConfig } from '@/config';

export class ExtendedClient extends Client {
  cluster = new ClusterClient(this);
  cooldown: Map<string, Map<string, number>> = new Map();
  locale: Map<string, Locale> = new Map();
  log = {
    info: (...content: any[]) => Log.info(this.prefix, ...content),
    debug: (...content: any[]) => Log.debug(this.prefix, ...content),
    warn: (...content: any[]) => Log.warn(this.prefix, ...content),
    error: (...content: any[]) => Log.error(this.prefix, ...content),
  };

  private prefix = chalk`{cyan [}{reset CLUSTER} {green #${this.cluster.id}}{cyan ]}`;

  constructor(option: ClientOptions) {
    super(option);
  }

  error = (error: any) => {
    if (!error.toString().includes('DiscordAPIError[10062]'))
      this.log.error(error);
  };

  async start() {
    await DiscordUtil.refresh();
    await Language.init();
    await ExtendedEvent.init();
    await ExtendedComponent.init();
    await ExtendedTextCommand.init();
    await ExtendedApplicationCommand.init();
    await this.registerModules();
    await this.login(process.env.BOT_TOKEN);
    this.log.info(chalk`Logged in as {green ${this.user?.tag}}!`);
  }

  private async registerModules() {
    await this.addCommands();
    await this.addComponents();
    await this.addAutoComplete();
    await this.addTextCommands();
    await this.addEvents();
    this.on('shardReady', (id) =>
      this.log.info(chalk`Shard {green #${id}} is ready!`),
    );
  }

  private registerLocale(interaction: Interaction) {
    if (
      !this.locale.has(interaction.user.id) ||
      this.locale.get(interaction.user.id) != interaction.locale
    )
      this.locale.set(interaction.user.id, interaction.locale);
  }

  private async addCommands() {
    this.on(Events.InteractionCreate, (interaction) => {
      if (
        !interaction.isChatInputCommand() &&
        !interaction.isContextMenuCommand()
      )
        return;

      const type = interaction.isChatInputCommand()
        ? ApplicationCommandType.ChatInput
        : interaction.isMessageContextMenuCommand()
          ? ApplicationCommandType.Message
          : ApplicationCommandType.User;

      this.registerLocale(interaction);

      const name = interaction.isChatInputCommand()
        ? [
            interaction.commandName,
            interaction.options.getSubcommandGroup(false),
            interaction.options.getSubcommand(false),
          ]
            .filter((v) => v)
            .join(' ')
        : interaction.commandName;

      const commandKey = [...ExtendedApplicationCommand.commands.keys()].find(
        (v) => v.type == type && v.name.includes(name),
      );
      if (!commandKey) return;

      const command = ExtendedApplicationCommand.commands.get(commandKey);
      if (!command) return;

      const validate = this.checkOptions({
        interaction,
        commandName: null,
        options: command.options,
      });
      if (!validate.status)
        if (!validate.message) return;
        else return interaction.reply(validate.message).catch(this.error);

      Promise.resolve()
        .then(() =>
          command.run({
            client: this,
            interaction,
            args:
              command.type == ApplicationCommandType.ChatInput
                ? (interaction.options as CommandInteractionOptionResolver)
                : undefined,
          }),
        )
        .catch(this.error);
    });
  }

  private async addComponents() {
    this.on(Events.InteractionCreate, (interaction) => {
      if (!('customId' in interaction)) return;

      this.registerLocale(interaction);

      ExtendedComponent.removeExpired();

      const componentKey = [...ExtendedComponent.components.keys()].find(
        (v) => interaction.customId == v.id,
      );
      if (!componentKey) return;

      const component = ExtendedComponent.components.get(componentKey);
      if (!component) return;

      const validate = this.checkOptions({
        interaction,
        commandName: null,
        options: component.options,
      });
      if (!validate.status)
        if (!validate.message) return;
        else return interaction.reply(validate.message).catch(this.error);

      Promise.resolve()
        .then(() => component.run({ client: this, interaction }))
        .catch(this.error);

      if (component.options?.expire) {
        ExtendedComponent.components.set(
          {
            ...componentKey,
            expireTime: Date.now() + component.options.expire,
          },
          component,
        );
        ExtendedComponent.components.delete(componentKey);
      }

      if (component.once) ExtendedComponent.components.delete(componentKey);
    });
  }

  private async addAutoComplete() {
    this.on(Events.InteractionCreate, (interaction) => {
      if (!interaction.isAutocomplete()) return;

      this.registerLocale(interaction);

      const name = [
        interaction.commandName,
        interaction.options.getSubcommandGroup(false),
        interaction.options.getSubcommand(false),
      ]
        .filter((v) => v)
        .join(' ');

      const commandKey = [...ExtendedApplicationCommand.commands.keys()].find(
        (v) =>
          v.type == ApplicationCommandType.ChatInput && v.name.includes(name),
      );
      if (!commandKey) return;

      const command = ExtendedApplicationCommand.commands.get(commandKey);
      if (!command) return;

      Promise.resolve()
        .then(() =>
          command.autocomplete?.({
            client: this,
            interaction,
            args: interaction.options,
          }),
        )
        .catch(this.error);
    });
  }

  private async addTextCommands() {
    this.on(Events.MessageCreate, (message) => {
      if (message.author.bot) return;

      const prefix = BotConfig.COMMAND_PREFIX.sort(
        (a, b) => b.length - a.length,
      ).find((v) => message.content.trim().startsWith(v));
      if (!prefix) return;

      const content = message.content.slice(prefix.length).trim();
      const commandKey = [...ExtendedTextCommand.commands.keys()].find((v) =>
        v.commandName
          .sort((a, b) => b.length - a.length)
          .find((n) => content.startsWith(n)),
      );
      if (!commandKey) return;

      const command = ExtendedTextCommand.commands.get(commandKey);
      if (!command) return;

      if (
        message.channel.type != ChannelType.DM &&
        !message.guild?.members?.me?.permissions?.has(
          PermissionFlagsBits.SendMessages,
        )
      )
        return;

      const validate = this.checkOptions({
        message,
        commandName: commandKey.commandName[0],
        options: command.options,
      });
      if (!validate.status)
        if (!validate.message) return;
        else
          return message
            .reply(validate.message)
            .then((m) => setTimeout(() => m.delete(), 10000))
            .catch(this.error);

      Promise.resolve()
        .then(() =>
          command.run({
            client: this,
            message,
            locale:
              this.locale.get(message.author.id) ?? BotConfig.DEFAULT_LANGUAGE,
          }),
        )
        .catch(this.error);
    });
  }

  private async addEvents() {
    for (const event of ExtendedEvent.events.values())
      this[event.once ? 'once' : 'on'](event.event, (...args) => {
        if (event.options) {
          const data = args.find((v) => 'reply' in v) as
            | Interaction
            | Message
            | null;

          if (data) {
            const validate = this.checkOptions({
              interaction: data,
              commandName: event.event,
              options: event.options,
            });
            if (!validate.status) return;
          }
        }

        Promise.resolve()
          .then(() => event.run(this, ...args))
          .catch(this.error);
      });
  }

  private checkOptions<T extends Interaction | Message>({
    interaction,
    message,
    commandName,
    options,
  }: {
    interaction?: T;
    message?: T;
    commandName: T extends Message ? string : null;
    options?: Partial<{
      onlyGuild: boolean;
      onlyDevelopment: boolean;
      guildId: ValueOrArray<string>;
      cooldown: number;
      permission: Partial<{
        user: ValueOrArray<PermissionResolvable>;
        bot: ValueOrArray<PermissionResolvable>;
      }>;
      botAdmin: boolean;
      botDeveloper: boolean;
      guildOwner: boolean;
    }>;
  }): {
    status: boolean;
    message?: T extends Interaction
      ? InteractionReplyOptions
      : BaseMessageOptions;
  } {
    if (process.env.NODE_ENV != 'production' && options?.onlyDevelopment)
      return { status: false };

    const data = interaction ?? message;
    if (!data) return { status: false };

    if (
      options?.guildId &&
      toArray(options.guildId).includes(data.guild?.id ?? '')
    )
      return { status: false };

    const locale =
      'locale' in data
        ? data.locale
        : (this.locale.get(data.author.id) ?? BotConfig.DEFAULT_LANGUAGE);
    const user = 'user' in data ? data.user : data.author;
    const cooldownId =
      'commandId' in data ? data.commandId : (commandName ?? '');

    if (options?.onlyGuild && !data.guild)
      return {
        status: false,
        message: {
          embeds: [
            new EmbedBuilder()
              .setTitle(
                Language.get(locale, 'Embed_Warn_OnlyCanUseInGuild_Title'),
              )
              .setDescription(
                Language.get(
                  locale,
                  'Embed_Warn_OnlyCanUseInGuild_Description',
                ),
              )
              .setColor(EmbedConfig.WARN_COLOR)
              .setFooter({
                text: user.tag,
                iconURL: user.avatarURL() ?? undefined,
              })
              .setTimestamp(),
          ],
          allowedMentions: { parse: [] },
          ...('locale' in data && {
            flags: MessageFlags.Ephemeral,
          }),
        },
      };

    if (options?.cooldown) {
      const now = Date.now();
      if (!this.cooldown.has(user.id)) this.cooldown.set(user.id, new Map());
      if (!this.cooldown.get(user.id)?.has(cooldownId))
        this.cooldown.get(user.id)?.set(cooldownId, 0);

      const cooldown = this.cooldown.get(user.id)?.get(cooldownId) ?? 0;
      if (cooldown > now)
        return {
          status: false,
          message: {
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  Language.get(locale, 'Embed_Warn_InteractionCooldown_Title'),
                )
                .setDescription(
                  Language.get(
                    locale,
                    'Embed_Warn_InteractionCooldown_Description',
                    (cooldown / 1000) | 0,
                  ),
                )
                .setColor(EmbedConfig.WARN_COLOR)
                .setFooter({
                  text: user.tag,
                  iconURL: user.avatarURL() ?? undefined,
                })
                .setTimestamp(),
            ],
            allowedMentions: { parse: [] },
            ...('locale' in data && {
              flags: MessageFlags.Ephemeral,
            }),
          },
        };
      this.cooldown[user.id][cooldownId] = now + options.cooldown;
    }

    for (const target of ['bot', 'user']) {
      if (!options?.permission?.[target]) continue;
      const needPermission = DiscordUtil.checkPermission(
        target == 'user'
          ? 'memberPermissions' in data
            ? data.memberPermissions
            : data.member?.permissions
          : data.guild?.members.me?.permissions,
        options.permission[target],
      );
      if (needPermission.length)
        return {
          status: false,
          message: {
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  Language.get(
                    locale,
                    `Embed_Warn_NoPermission_${target}_Title` as keyof LanguageData,
                  ),
                )
                .setDescription(
                  '`' +
                    Language.get(
                      locale,
                      `Embed_Warn_NoPermission_${target}_Description` as keyof LanguageData,
                      needPermission
                        .map((v) => DiscordUtil.convertPermissionToString(v))
                        .join('`, `'),
                    ) +
                    '`',
                )
                .setColor(EmbedConfig.WARN_COLOR)
                .setFooter({
                  text: user.tag,
                  iconURL: user.avatarURL() ?? undefined,
                })
                .setTimestamp(),
            ],
            allowedMentions: { parse: [] },
            ...('locale' in data && {
              flags: MessageFlags.Ephemeral,
            }),
          },
        };
    }

    if (
      (options?.botAdmin || options?.botDeveloper) &&
      ![
        ...(options?.botAdmin ? DiscordUtil.adminId : []),
        ...(options?.botDeveloper ? DiscordUtil.developerId : []),
      ].includes(user.id)
    )
      return {
        status: false,
        message: {
          embeds: [
            new EmbedBuilder()
              .setTitle(
                Language.get(locale, 'Embed_Warn_OnlyBotAdminCanUse_Title'),
              )
              .setDescription(
                Language.get(
                  locale,
                  'Embed_Warn_OnlyBotAdminCanUse_Description',
                ),
              )
              .setColor(EmbedConfig.WARN_COLOR)
              .setFooter({
                text: user.tag,
                iconURL: user.avatarURL() ?? undefined,
              })
              .setTimestamp(),
          ],
          allowedMentions: { parse: [] },
          ...('locale' in data && {
            flags: MessageFlags.Ephemeral,
          }),
        },
      };

    if (options?.guildOwner && data.guild?.ownerId != user.id)
      return {
        status: false,
        message: {
          embeds: [
            new EmbedBuilder()
              .setTitle(
                Language.get(locale, 'Embed_Warn_OnlyGuildOwnerCanUse_Title'),
              )
              .setDescription(
                Language.get(
                  locale,
                  'Embed_Warn_OnlyGuildOwnerCanUse_Description',
                ),
              )
              .setColor(EmbedConfig.WARN_COLOR)
              .setFooter({
                text: user.tag,
                iconURL: user.avatarURL() ?? undefined,
              })
              .setTimestamp(),
          ],
          allowedMentions: { parse: [] },
          ...('locale' in data && {
            flags: MessageFlags.Ephemeral,
          }),
        },
      };

    return { status: true };
  }
}
