import 'dotenv/config';
import {
  Cluster,
  ExtendedApplicationCommand,
  ExtendedEvent,
  ExtendedTextCommand,
  Language,
} from './structure';
import { DiscordUtil, Log } from './common';
import chalk from 'chalk';

async function bootstrap() {
  // Open Health Check Server
  if (process.env.HEALTH_CHECK == 'true') await import('./health');

  // Initialize Discord Data
  await DiscordUtil.refresh();

  // Register Language Data for Register Commands
  await Language.init();

  // Initialize Commands & Events
  await ExtendedEvent.init();
  await ExtendedTextCommand.init();
  await ExtendedApplicationCommand.init();

  // Register Application Commands
  if (!process.env.WITHOUT_REGISTER) {
    Log.info(chalk`Registering {green Application Commands}...`);
    await ExtendedApplicationCommand.registerCommand();
    await ExtendedApplicationCommand.registerGuildCommand();
  }

  // Log Loaded Commands & Events & Menus
  await ExtendedEvent.logEvents();
  await ExtendedTextCommand.logCommand();
  await ExtendedApplicationCommand.logCommand();

  // Spawn Discord Client Cluster
  await Cluster.spawn();
}
bootstrap();
