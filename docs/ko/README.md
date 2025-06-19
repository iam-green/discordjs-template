<h1 align="center">DiscordJS Template</h1>
<p align="center">
  많은 명령어, 이벤트, 컴포넌트 등을 만들기 쉽게 하는 DiscordJS 템플릿<br>
  TypeScript 및 JavaScript 지원<br>
  <a href="/README.md">English</a>
  &nbsp;|&nbsp;
  <a href="/docs/ko/README.md">한국어</a>
</p>

## 목차

- [설치 과정](#설치-과정)
- [기능](#기능)
- [명령어, 컴포넌트, 이벤트 구조](#명령어-컴포넌트-이벤트-구조)
  - [텍스트 명령어](#텍스트-명령어)
  - [어플리케이션 명령어](#어플리케이션-명령어)
  - [컴포넌트](#컴포넌트)
  - [이벤트](#이벤트)
- [라이선스](#라이선스)

## 설치 과정

1. 프로젝트를 [다운로드](https://github.com/iam-green/discordjs-template/archive/refs/heads/main.zip) 및 압축해제를 하거나 복제하세요.
2. `package.json` 파일에 있는 프로젝트 이름을 바꾸세요.
3. 아래 파일들의 이름을 변경하세요:
   - `.env.example` → `.env`: Discord Bot 토큰과 같은 환경변수 값을 저장하는데 사용합니다.
4. `.env`의 모든 필수 값을 입력합니다.
5. 필요한 모든 종속성 설치하세요: `npm install`
6. 프로젝트를 빌드하세요: `npm run build`
7. `npm run start` 명령어를 사용하여 봇을 실행하세요.

## 기능

- [discord.js](https://discord.js.org/) 최신 버전 지원
- TypeScript & JavaScript 지원
- 데이터베이스 사용을 위한 Drizzle ORM 지원
- 모든 종류의 명령어 지원
  - 텍스트 명령어
  - 어플리케이션 명령어
    - 채팅 입력
      - 자동완성 지원
    - 유저 컨텍스트
    - 메세지 컨텍스트
- 컴포넌트 처리
  - 버튼
  - 선택 메뉴
- 사용하기 쉬운 모듈

## 명령어, 컴포넌트, 이벤트 구조

### 텍스트 명령어

```ts
export default new ExtendedTextCommand({
  name: ValueOrArray<string>, // 명령어 이름, 여러 개의 이름을 지원합니다.
  options?: Partial<{
    onlyGuild: boolean, // guild에서만 사용 가능한 명령어인지 여부
    onlyDevelopment: boolean, // 개발 모드에서만 사용 가능한 명령어인지 여부
    guildId: ValueOrArray<string>, // 명령어가 사용 가능한 guild ID, 여러 개의 ID를 지원합니다.
    cooldown: number, // 명령어 사용 쿨타임 (ms 단위)
    permission: Partial<{
      user: ValueOrArray<PermissionResolvable>, // 유저 권한, 여러 개의 권한을 지원합니다.
      bot: ValueOrArray<PermissionResolvable> // 봇 권한, 여러 개의 권한을 지원합니다.
    }>,
    botAdmin: boolean, // 봇 관리자만 사용 가능한 명령어인지 여부
    botDeveloper: boolean, // 봇 개발자만 사용 가능한 명령어인지 여부
    guildOwner: boolean // guild 소유자만 사용 가능한 명령어인지 여부
  }>,
  run: (options: {
    client: ExtendedClient,
    message: Message,
    locale: Locale // 유저의 상호작용으로 저장되어 있는 언어 설정
  }) => void
});
```

ExtendedTextCommand 클래스의 구조는 [여기](/src/structure/textCommand.ts)를 참고하세요.

<u>**/src/textCommand**</u> 경로에서 텍스트 명령어를 만들 수 있습니다.<br>
[여기](/src/config/bot.ts)에서 `TEXT_COMMAND_FOLDERS`를 수정하여 텍스트 명령어 폴더 위치를 변경할 수 있습니다.

### 어플리케이션 명령어

```ts
export default new ExtendedApplicationCommand({
  type: ApplicationCommandType, // ApplicationCommandType의 값 (ChatInput, User, Message);
  name: ValueOrArray<string>, // 명령어 이름, 여러 개의 이름을 지원합니다.
  description?: ValueOrArray<string>, // ChatInput 타입의 경우 필수, 다른 타입은 선택 사항
  localization?: Partial<{
    name: ValueOrArray<string>, // 다국어 지원을 위한 이름, 여러 개의 이름을 지원합니다.
    description: ValueOrArray<string> // 다국어 지원을 위한 설명, 여러 개의 설명을 지원합니다.
  }>,
  command?: // 명령어 빌더, ChatInput 타입의 경우 필수
    APIApplicationCommand | // 명령어 API 객체
    ((builder: SlashCommandBuilder) => SlashCommandBuilder), // 명령어 빌더 함수
  options?: Partial<{
    onlyGuild: boolean, // guild에서만 사용 가능한 명령어인지 여부
    onlyDevelopment: boolean, // 개발 모드에서만 사용 가능한 명령어인지 여부
    guildId: ValueOrArray<string>, // 명령어가 사용 가능한 guild ID, 여러 개의 ID를 지원합니다.
    cooldown: number, // 명령어 사용 쿨타임 (ms 단위)
    permission: Partial<{
      user: ValueOrArray<PermissionResolvable>, // 유저 권한, 여러 개의 권한을 지원합니다.
      bot: ValueOrArray<PermissionResolvable>, // 봇 권한, 여러 개의 권한을 지원합니다.
      defaultPermission: boolean // 기본 권한 설정 여부, true일 경우 유저 권한의 첫번째 값 이상의 권한을 요구합니다.
    }>,
    botAdmin: boolean, // 봇 관리자만 사용 가능한 명령어인지 여부
    botDeveloper: boolean, // 봇 개발자만 사용 가능한 명령어인지 여부
    guildOwner: boolean // guild 소유자만 사용 가능한 명령어인지 여부
  }>,
  run: (options: {
    client: ExtendedClient,
    interaction: Interaction,
    args?: CommandInteractionOptionResolver
  }) => void,
  autocomplete?: (options: { // ChatInput 타입의 명령어에서만 사용 가능
    client: ExtendedClient,
    interaction: AutocompleteInteraction,
    args: AutocompleteInteraction['options']
  }) => void
});
```

ExtendedApplicationCommand 클래스의 구조는 [여기](/src/structure/applicationCommand.ts)를 참고하세요.

<u>**/src/commands**</u> 경로에서 어플리케이션 명령어를 만들 수 있습니다.<br>
[여기](/src/config/bot.ts)에서 `APPLICATION_COMMAND_FOLDERS`를 수정하여 어플리케이션 명령어 폴더 위치를 변경할 수 있습니다.

### 컴포넌트

```ts
export default ExtendedComponent({
  type: ComponentType, // Button, StringSelect, TextInput, UserSelect, RoleSelect, MentionableSelect, ChannelSelect
  id: string, // 컴포넌트 ID
  once?: boolean, // 컴포넌트가 한 번만 실행되는지 여부
  randomId?: boolean, // 컴포넌트 ID가 랜덤으로 생성되는지 여부
  component: APIComponent | // 컴포넌트 JSON
    (option: Builder) => Builder, // 컴포넌트별 Builder 참고
  options?: Partial<{
    onlyGuild: boolean, // guild에서만 사용 가능한 컴포넌트인지 여부
    onlyDevelopment: boolean, // 개발 모드에서만 사용 가능한 컴포넌트인지 여부
    guildId: ValueOrArray<string>, // 컴포넌트가 사용 가능한 guild ID, 여러 개의 ID를 지원합니다.
    cooldown: number, // 컴포넌트 사용 쿨타임 (ms 단위)
    permission: Partial<{
      user: ValueOrArray<PermissionResolvable>, // 유저 권한, 여러 개의 권한을 지원합니다.
      bot: ValueOrArray<PermissionResolvable> // 봇 권한, 여러 개의 권한을 지원합니다.
    }>,
    botAdmin: boolean, // 봇 관리자만 사용 가능한 컴포넌트인지 여부
    botDeveloper: boolean, // 봇 개발자만 사용 가능한 컴포넌트인지 여부
    guildOwner: boolean, // guild 소유자만 사용 가능한 컴포넌트인지 여부
    expire: number // 컴포넌트가 만료되는 시간 (ms 단위), 입력하지 않을 경우 만료되지 않음
  }>;
  run: (options: {
    client: ExtendedClient,
    interaction: Interaction
  }) => void;
});
```

ExtendedComponent 함수의 구조는 [여기](/src/structure/component.ts)를 참고하세요.

<u>**/src/components**</u> 경로에서 컴포넌트를 만들 수 있습니다.<br>
[여기](/src/config/bot.ts)에서 `COMPONENT_FOLDERS`를 수정하여 컴포넌트 폴더 위치를 변경할 수 있습니다.

### 이벤트

```ts
export default new ExtendedEvent({
  event: keyof ClientEvents, // 이벤트 key
  once?: boolean, // 한번만 실행 여부
  options?: Partial<{
    onlyDevelopment: boolean // 개발 모드에서만 실행되는 이벤트인지 여부
  }>,
  run: (
    client: ExtendedClient,
    ...args: ClientEvents[keyof ClientEvents] // ClientEvents의 이벤트 타입에 따라 인자가 달라집니다.
  ) => void
});
```

ExtendedEvent 클래스의 구조는 [여기](/src/structure/event.ts)를 참고하세요.

<u>**/src/events**</u> 경로에서 이벤트를 만들 수 있습니다.<br>
[여기](/src/config/bot.ts)에서 `EVENT_FOLDERS`를 수정하여 이벤트 폴더 위치를 변경할 수 있습니다.

## 라이선스

[**GPL-3.0**](/LICENSE), General Public License v3
