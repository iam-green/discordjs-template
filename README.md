<h1 align="center">DiscordJS Template</h1>
<p align="center">
  DiscordJS template for easy use of many commands, events, components and more<br>
  Supports TypeScript and JavaScript<br>
  <a href="/README.md">English</a>
  &nbsp;|&nbsp;
  <a href="/docs/ko/README.md">한국어</a>
</p>

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Command, Component, Event Structure](#command-component-event-structure)
  - [Text Command](#text-command)
  - [Application Command](#application-command)
  - [Component](#component)
  - [Event](#event)
- [License](#license)

## Installation

1. [Download](https://github.com/iam-green/discordjs-template/archive/refs/heads/main.zip) and decompress or clone this project.
2. Rename your project in the `package.json` file.
3. Rename the following files:
   - `.env.example` → `.env`: Used for secrets, like the Discord Bot Token.
4. Fill all the required values in `.env`.
5. Install all required dependencies: `npm install`
6. Build a TypeScript project: `npm run build`
7. Run the command `npm run start` to start the bot.

## Features

- Support latest version of [discord.js](https://discord.js.org/)
- Support TypeScript & JavaScript
- Support Drizzle ORM for using Database
- Supports all possible type of commands
  - Text Commands
  - Application Commands
    - Chat Input
      - Support Autocomplete
    - User Context
    - Message Context
- Handles Components
  - Buttons
  - Select Menus
- Easy-to-use modules

## Command, Component, Event Structure

### Text Command

```ts
export default new ExtendedTextCommand({
  name: ValueOrArray<string>, // Command name, supports multiple names
  options?: Partial<{
    onlyGuild: boolean, // Whether the command can only be used in a guild
    onlyDevelopment: boolean, // Whether the command can only be used in development mode
    guildId: ValueOrArray<string>, // Guild IDs where the command can be used, supports multiple IDs
    cooldown: number, // Command cooldown in milliseconds
    permission: Partial<{
      user: ValueOrArray<PermissionResolvable>, // User permissions, supports multiple permissions
      bot: ValueOrArray<PermissionResolvable> // Bot permissions, supports multiple permissions
    }>,
    botAdmin: boolean, // Whether the command can only be used by bot admins
    botDeveloper: boolean, // Whether the command can only be used by bot developers
    guildOwner: boolean // Whether the command can only be used by guild owners
  }>,
  run: (options: {
    client: ExtendedClient,
    message: Message,
    locale: Locale // User's language setting stored in interaction
  }) => void
});
```

For the structure of the ExtendedTextCommand class, refer to [this file](/src/structure/textCommand.ts).

You can create text commands in the <u>**/src/textCommand**</u> directory.<br>
Modify the `TEXT_COMMAND_FOLDERS` in [this file](/src/config/bot.ts) to change the location of the text command folders.



### Application Command

```ts
export default new ExtendedApplicationCommand({
  type: ApplicationCommandType, // The value of ApplicationCommandType (ChatInput, User, Message);
  name: ValueOrArray<string>, // Command name; supports multiple names.
  description?: ValueOrArray<string>, // Required for ChatInput type, optional for others.
  localization?: Partial<{
    name: ValueOrArray<string>, // Localized name; supports multiple names.
    description: ValueOrArray<string> // Localized description; supports multiple descriptions.
  }>,
  command?: // Command builder; required for ChatInput type.
    APIApplicationCommand | // Command API object.
    ((builder: SlashCommandBuilder) => SlashCommandBuilder), // Command builder function.
  options?: Partial<{
    onlyGuild: boolean, // Whether the command is available only in guilds.
    onlyDevelopment: boolean, // Whether the command is available only in development mode.
    guildId: ValueOrArray<string>, // Guild IDs where the command is available; supports multiple IDs.
    cooldown: number, // Command cooldown in milliseconds.
    permission: Partial<{
      user: ValueOrArray<PermissionResolvable>, // User permissions; supports multiple permissions.
      bot: ValueOrArray<PermissionResolvable>, // Bot permissions; supports multiple permissions.
      defaultPermission: boolean // If true, requires the user to have at least the first permission.
    }>,
    botAdmin: boolean, // Command available only to bot admins.
    botDeveloper: boolean, // Command available only to bot developers.
    guildOwner: boolean // Command available only to guild owners.
  }>,
  run: (options: {
    client: ExtendedClient,
    interaction: Interaction,
    args?: CommandInteractionOptionResolver
  }) => void,
  autocomplete?: (options: { // Only available for ChatInput type commands.
    client: ExtendedClient,
    interaction: AutocompleteInteraction,
    args: AutocompleteInteraction['options']
  }) => void
});
```

For details on the structure of the ExtendedApplicationCommand class, see [this file](/src/structure/applicationCommand.ts).

You can create application commands in the <u>**/src/commands**</u> directory.<br>
Modify `APPLICATION_COMMAND_FOLDERS` in [this file](/src/config/bot.ts) to change the location of the application command folders.

### Component

```ts
export default ExtendedComponent({
  type: ComponentType, // Button, StringSelect, TextInput, UserSelect, RoleSelect, MentionableSelect, ChannelSelect
  id: string, // Component ID
  once?: boolean, // Whether the component should execute only once
  randomId?: boolean, // Whether the component ID is generated randomly
  component: APIComponent | // Component JSON
    (option: Builder) => Builder, // Refer to the specific Builder for each component
  options?: Partial<{
    onlyGuild: boolean, // Whether the component is available only in guilds
    onlyDevelopment: boolean, // Whether the component is available only in development mode
    guildId: ValueOrArray<string>, // Guild IDs where the component is allowed; supports multiple IDs
    cooldown: number, // Component cooldown in milliseconds
    permission: Partial<{
      user: ValueOrArray<PermissionResolvable>, // Required user permissions; supports multiple permissions
      bot: ValueOrArray<PermissionResolvable> // Required bot permissions; supports multiple permissions
    }>,
    botAdmin: boolean, // Whether the component is available only to bot admins
    botDeveloper: boolean, // Whether the component is available only to bot developers
    guildOwner: boolean, // Whether the component is available only to guild owners
    expire: number // Time in milliseconds after which the component expires; if omitted, it does not expire
  }>;
  run: (options: {
    client: ExtendedClient,
    interaction: Interaction
  }) => void;
});
```

For the structure of the ExtendedComponent function, refer to [this file](/src/structure/component.ts).

You can create components in the <u>**/src/components**</u> directory.<br>
Modify `COMPONENT_FOLDERS` in [this file](/src/config/bot.ts) to change the location of the component folder.

### Event

```ts
export default new ExtendedEvent({
  event: keyof ClientEvents, // Event key
  once?: boolean, // Execute only once if true
  options?: Partial<{
    onlyDevelopment: boolean // Indicates if the event should run only in development mode
  }>,
  run: (
    client: ExtendedClient,
    ...args: ClientEvents[keyof ClientEvents] // Arguments vary depending on the ClientEvents event type
  ) => void
});
```

For the structure of the ExtendedEvent class, refer to [this file](/src/structure/event.ts).

You can create events in the <u>**/src/events**</u> directory.<br>
Modify `EVENT_FOLDERS` in [this file](/src/config/bot.ts) to change the event folder's location.

## License

[**GPL-3.0**](/LICENSE), General Public License v3
