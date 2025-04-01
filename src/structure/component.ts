import {
  APIButtonComponent,
  APIChannelSelectComponent,
  APIMentionableSelectComponent,
  APIModalInteractionResponseCallbackData,
  APIRoleSelectComponent,
  APIStringSelectComponent,
  APIUserSelectComponent,
  ButtonBuilder,
  ButtonInteraction,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  ComponentType,
  MentionableSelectMenuBuilder,
  MentionableSelectMenuInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionResolvable,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
} from 'discord.js';
import { ValueOrArray } from 'drizzle-orm';
import { ExtendedClient } from './client';
import { GuildInteraction, Log, sep } from '@/common';
import { randomUUID } from 'crypto';
import { glob } from 'glob';
import chalk from 'chalk';

export type SupportComponentType =
  | ComponentType.Button
  | ComponentType.StringSelect
  | ComponentType.TextInput
  | ComponentType.UserSelect
  | ComponentType.RoleSelect
  | ComponentType.MentionableSelect
  | ComponentType.ChannelSelect;

export type ComponentAPIOrBuilder<API, Builder> =
  | Omit<API, 'custom_id'>
  | ((option: Builder) => Builder);

export type ComponentComponentType = {
  [ComponentType.Button]: ComponentAPIOrBuilder<
    APIButtonComponent,
    ButtonBuilder
  >;
  [ComponentType.StringSelect]: ComponentAPIOrBuilder<
    APIStringSelectComponent,
    StringSelectMenuBuilder
  >;
  [ComponentType.TextInput]: ComponentAPIOrBuilder<
    APIModalInteractionResponseCallbackData,
    ModalBuilder
  >;
  [ComponentType.UserSelect]: ComponentAPIOrBuilder<
    APIUserSelectComponent,
    UserSelectMenuBuilder
  >;
  [ComponentType.RoleSelect]: ComponentAPIOrBuilder<
    APIRoleSelectComponent,
    RoleSelectMenuBuilder
  >;
  [ComponentType.MentionableSelect]: ComponentAPIOrBuilder<
    APIMentionableSelectComponent,
    MentionableSelectMenuBuilder
  >;
  [ComponentType.ChannelSelect]: ComponentAPIOrBuilder<
    APIChannelSelectComponent,
    ChannelSelectMenuBuilder
  >;
};

export type ComponentBuilderType = {
  [ComponentType.Button]: ButtonBuilder;
  [ComponentType.StringSelect]: StringSelectMenuBuilder;
  [ComponentType.TextInput]: ModalBuilder;
  [ComponentType.UserSelect]: UserSelectMenuBuilder;
  [ComponentType.RoleSelect]: RoleSelectMenuBuilder;
  [ComponentType.MentionableSelect]: MentionableSelectMenuBuilder;
  [ComponentType.ChannelSelect]: ChannelSelectMenuBuilder;
};

export type ComponentInteractionType = {
  [ComponentType.Button]: ButtonInteraction;
  [ComponentType.StringSelect]: StringSelectMenuInteraction;
  [ComponentType.TextInput]: ModalSubmitInteraction;
  [ComponentType.UserSelect]: UserSelectMenuInteraction;
  [ComponentType.RoleSelect]: RoleSelectMenuInteraction;
  [ComponentType.MentionableSelect]: MentionableSelectMenuInteraction;
  [ComponentType.ChannelSelect]: ChannelSelectMenuInteraction;
};

export const ComponentBuilderMap: Record<
  SupportComponentType,
  new (option: any) => any
> = {
  [ComponentType.Button]: ButtonBuilder,
  [ComponentType.ChannelSelect]: ChannelSelectMenuBuilder,
  [ComponentType.MentionableSelect]: MentionableSelectMenuBuilder,
  [ComponentType.RoleSelect]: RoleSelectMenuBuilder,
  [ComponentType.StringSelect]: StringSelectMenuBuilder,
  [ComponentType.TextInput]: ModalBuilder,
  [ComponentType.UserSelect]: UserSelectMenuBuilder,
};

export type ComponentRunOptions<
  Type extends SupportComponentType,
  InGuild extends boolean,
> = {
  /**
   * Discord Client
   */
  client: ExtendedClient;

  /**
   * Interaction Data
   */
  interaction: GuildInteraction<ComponentInteractionType[Type], InGuild>;
};

export type ExtendedComponentType<
  Type extends SupportComponentType,
  InGuild extends boolean,
> = {
  /**
   * Discord Component Type
   */
  type: Type;

  /**
   * Discord Component ID
   */
  id: string;

  /**
   * Whether the component is single-use
   */
  once?: boolean;

  /**
   * Whether to randomly set the component ID
   */
  random_id?: boolean;

  /**
   * Component attributes
   */
  component: ComponentComponentType[Type];

  options?: Partial<{
    /**
     * Whether the component is only available in guilds
     * * If you enable this option, you can import guild-related information.
     * @default false
     */
    only_guild: InGuild;

    /**
     * Set specific guilds to use the component
     * * Configures the component to be usable only in the specified guilds.
     */
    guild_id: ValueOrArray<string>;

    /**
     * component Cooldown
     * * Sets the cooldown for the component.
     * * * The unit is in milliseconds.
     */
    cooldown: number;

    /**
     * Component Permissions
     * * Sets the permissions required to use the component.
     */
    permission: Partial<{
      /**
       * User Permissions
       * * Permissions required for users to use the component.
       */
      user: ValueOrArray<PermissionResolvable>;

      /**
       * Bot Permissions
       * Permissions required for the bot to execute the component.
       */
      bot: ValueOrArray<PermissionResolvable>;
    }>;

    /**
     * Component for Bot Administrators Only
     * * Sets the component to be available only to bot administrators.
     * @default false
     */
    bot_admin: boolean;

    /**
     * Component for Bot Developers Only
     * * Sets the component to be available only to bot developers.
     * @default false
     */
    bot_developer: boolean;

    /**
     * Component for Guild Owners Only
     * * Sets the component to be available only to guild owners.
     * @default false
     */
    guild_owner: boolean;

    /**
     * Component expiration time
     * * The units are milli-seconds.
     */
    expire: number;
  }>;

  /**
   * Code to execute the component
   * * Write the code to execute the component.
   * @param options You can retrieve client data, interaction data.
   */
  run: (options: ComponentRunOptions<Type, InGuild>) => void;
};

export type ExtendedComponentMapKey = {
  path?: string;
  function_name?: string;
  id: string;
  expire?: number;
};

export type ExtendedComponentMap = Map<
  ExtendedComponentMapKey,
  ExtendedComponentType<SupportComponentType, boolean>
>;

const generateUUID = () => {
  let uuid = randomUUID();
  while ([...ExtendedComponent.list].find(([k]) => k.id.endsWith(uuid)))
    uuid = randomUUID();
  return uuid;
};

const componentTypeEnumName = (type: ComponentType) =>
  Object.keys(ComponentType).filter((key) => isNaN(Number(key)))[type - 1];

export const ExtendedComponent = <
  Type extends SupportComponentType,
  InGuild extends boolean,
>(
  data: ExtendedComponentType<Type, InGuild>,
) => {
  const id = data.id + ((data.random_id ?? true) ? '_' + generateUUID() : '');
  const expire = data.options?.expire
    ? Date.now() + data.options?.expire
    : undefined;
  const component = (
    data.component instanceof Function
      ? data.component(new ComponentBuilderMap[data.type]({ custom_id: id }))
      : data.component
  ) as ComponentBuilderType[Type];
  ExtendedComponent.list.set({ id, expire }, data);
  return Object.assign(component, { data });
};

ExtendedComponent.list = new Map() as ExtendedComponentMap;

ExtendedComponent.removeExpired = () => {
  for (const k of ExtendedComponent.list.keys())
    if (k.expire && k.expire < Date.now()) ExtendedComponent.list.delete(k);
};

/**
 * Initialize the component
 * @param folders Folders to search for components
 */
ExtendedComponent.init = async (
  folders: string[] = ['component', 'components'],
) => {
  const components = await glob(
    `${sep(__dirname)}/../{${folders.join(',')}}/**/*.{ts,js}`,
  );
  for (const path of components) {
    const content = await import(path);
    for (const key of Object.keys(content))
      if (content[key]?.data?.random_id == false) {
        const data = content[key].data as ExtendedComponentType<
          SupportComponentType,
          boolean
        >;
        ExtendedComponent.list.set(
          {
            path,
            function_name: key,
            id: data.id,
            expire: data.options?.expire
              ? Date.now() + data.options?.expire
              : undefined,
          },
          data,
        );
      }
  }
};

ExtendedComponent.logComponents = () => {
  for (const [key, { type }] of ExtendedComponent.list)
    if (key.path && key.function_name)
      Log.debug(
        [
          `Added ${chalk.green(componentTypeEnumName(type))} Component for ${chalk.red('Global')}`,
          `Location : ${chalk.yellow(key.path)}`,
          `Key Name : ${chalk.green(key.function_name)}`,
        ].join('\n'),
      );
};
