import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { Readable } from 'node:stream';
import { Log } from '@/common';
import { ExtendedClient } from './client';

export interface VoiceOption {
  volume: number;
  repeat: boolean;
  autoLeft: boolean;
}

export interface VoiceInfo {
  channelId: string;
  voice: VoiceConnection;
  queue: VoiceQueueInfo[];
  resource?: AudioResource;
  player?: AudioPlayer;
  option?: Partial<VoiceOption>;
  status: {
    adding: boolean;
    voiceAttempt: number;
    voiceRestarting: boolean;
  };
}

export interface VoiceQueueInfo {
  voice: () => string | Readable | Promise<string | Readable>;
  date?: Date;
  volume?: number;
  info?: any;
}

export class Voice {
  public static list = new Map<string, VoiceInfo>();

  static checkJoined(guildId: string) {
    return this.list.has(guildId);
  }

  static async join(
    client: ExtendedClient,
    guildId: string,
    channelId: string,
    option?: Partial<VoiceOption>,
  ) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    this.list.set(guildId, {
      channelId,
      voice: joinVoiceChannel({
        channelId,
        guildId,
        adapterCreator: guild.voiceAdapterCreator,
      }),
      queue: [],
      option,
      status: {
        adding: false,
        voiceAttempt: 1,
        voiceRestarting: false,
      },
    });
  }

  static async subscribe(guildId: string, option: VoiceQueueInfo) {
    const voice = this.list.get(guildId);
    if (!voice) return;
    voice.resource = createAudioResource(await voice.queue[0].voice(), {
      inlineVolume: true,
    });
    voice.resource.volume?.setVolume(
      (option.volume ?? 1) * (voice.option?.volume ?? 1),
    );
    voice.player?.play(voice.resource);
    (voice.voice as any)?.setMaxListeners(0);
    if (voice.player) voice.voice.subscribe(voice.player);
  }

  static async play(guildId: string, option: VoiceQueueInfo) {
    const voice = this.list.get(guildId);
    if (!voice) return;

    voice.queue.push(option);
    if (voice.queue.length > 1) return;
    if (!voice.player)
      voice.player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play },
      });
    (voice.player as any)?.setMaxListeners(0);

    // Voice Connection Unexpected Disconnection Handling
    voice.voice.on('stateChange', async (_, newState) => {
      if (
        newState.status == VoiceConnectionStatus.Disconnected &&
        newState.reason == VoiceConnectionDisconnectReason.WebSocketClose &&
        ![4006, 4014].includes(newState.closeCode)
      )
        this.quit(guildId);
    });

    // Voice Connection Error Handling
    voice.voice.on('error', async () => {
      if (voice.voice.state.status != VoiceConnectionStatus.Destroyed)
        this.quit(guildId);
    });

    // Voice Player Error Handling
    voice.player?.on('error', async (e) => {
      if (voice.status.voiceRestarting) return;
      voice.status.voiceRestarting = true;
      Log.warn(
        `AudioPlayer error occurred, attempt: ${++voice.status.voiceAttempt}`,
      );
      if (voice.status.voiceAttempt > 3) throw e;
      voice.status.voiceRestarting = false;
      return await this.subscribe(guildId, option);
    });

    // Voice Player Idle Handling
    voice.player?.on(AudioPlayerStatus.Idle, async () => {
      if (voice.status.voiceRestarting) return;
      voice.status.voiceAttempt = 1;
      if (voice.status.adding) return;
      voice.status.adding = true;
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (voice.option?.repeat) voice.queue.push(voice.queue[0]);
      voice.queue.shift();
      voice.queue.sort(
        (a, b) => +(a.date ?? new Date(0)) - +(b.date ?? new Date(0)),
      );
      if (voice.queue.length > 0) await this.subscribe(guildId, option);
      voice.status.adding = false;
    });
  }

  static skip(guildId: string, count: number = 1) {
    const voice = this.list.get(guildId);
    if (!voice) return;
    const queue = voice.queue.splice(
      0,
      (count > voice.queue.length ? voice.queue.length : count) - 1,
    );
    if (voice.option?.repeat) voice.queue.push(...queue);
    voice.player?.stop();
  }

  static shuffle(guildId: string) {
    const voice = this.list.get(guildId);
    if (!voice) return;
    voice.queue = [
      voice.queue[0],
      ...voice.queue.slice(1).sort(() => Math.random() - 0.5),
    ];
  }

  static repeat(guildId: string, status: boolean) {
    const voice = this.list.get(guildId);
    if (!voice) return;
    if (!voice.option) voice.option = {};
    voice.option.repeat = status;
  }

  static volume(guildId: string, volume: number) {
    volume = volume > 2 ? 2 : volume < 0 ? 0 : volume;
    const voice = this.list.get(guildId);
    if (!voice) return;
    if (!voice.option) voice.option = {};
    voice.option.volume = volume;
    voice.resource?.volume?.setVolume((voice.queue[0].volume ?? 1) * volume);
  }

  static stop(guildId: string) {
    const voice = this.list.get(guildId);
    if (!voice) return;
    voice.queue = [];
    voice.player?.stop();
  }

  static quit(guildId: string) {
    const voice = this.list.get(guildId);
    if (!voice) return;
    voice.queue = [];
    voice.player?.stop();
    voice.voice.destroy();
    this.list.delete(guildId);
  }
}
