import 'dotenv/config';
import {
  Cluster,
  ExtendedApplicationCommand,
  ExtendedEvent,
  ExtendedTextCommand,
  Language,
} from './structure';
import { DiscordUtil } from './common';

async function bootstrap() {
  // Open Health Check Server
  if (process.env.HEALTH_CHECK) await import('./health');

  // Initialize Discord Data
  await DiscordUtil.refresh();

  // Register Language Data for Register Commands
  await Language.init();

  // Initialize Commands & Events
  await ExtendedEvent.init();
  await ExtendedTextCommand.init();
  await ExtendedApplicationCommand.init();

  // Register Application Commands
  await ExtendedApplicationCommand.registerCommand();
  await ExtendedApplicationCommand.registerGuildCommand();

  // Log Loaded Commands & Events & Menus
  await ExtendedEvent.logEvents();
  await ExtendedTextCommand.logCommand();
  await ExtendedApplicationCommand.logCommand();

  // Spawn Discord Client Cluster
  await Cluster.spawn();
}
bootstrap();
