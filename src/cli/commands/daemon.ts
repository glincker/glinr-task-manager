import { Command } from 'commander';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { execSync, spawnSync } from 'child_process';
import chalk from 'chalk';
import { success, error, info, warn } from '../utils/output.js';

const PLIST_LABEL = 'com.profclaw.agent';
const PLIST_PATH = path.join(os.homedir(), 'Library', 'LaunchAgents', `${PLIST_LABEL}.plist`);
const SYSTEMD_PATH = path.join(os.homedir(), '.config', 'systemd', 'user', 'profclaw.service');
const PLATFORM = process.platform;

function getProfClawBin(): string {
  try {
    const bin = execSync('which profclaw', { encoding: 'utf8' }).trim();
    return bin || 'profclaw';
  } catch {
    return process.argv[1] || 'profclaw';
  }
}

function generatePlist(bin: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${bin}</string>
    <string>serve</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${path.join(os.homedir(), '.profclaw', 'daemon.log')}</string>
  <key>StandardErrorPath</key>
  <string>${path.join(os.homedir(), '.profclaw', 'daemon-error.log')}</string>
</dict>
</plist>`;
}

function generateSystemdUnit(bin: string): string {
  return `[Unit]
Description=profClaw AI Agent
After=network.target

[Service]
Type=simple
ExecStart=${bin} serve
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
`;
}

export function daemonCommand(): Command {
  const cmd = new Command('daemon')
    .description('Manage profClaw as a system service (launchd/systemd)');

  cmd
    .command('install')
    .description('Install profClaw as a system service')
    .action(() => {
      const bin = getProfClawBin();
      try {
        if (PLATFORM === 'darwin') {
          fs.mkdirSync(path.dirname(PLIST_PATH), { recursive: true });
          fs.mkdirSync(path.join(os.homedir(), '.profclaw'), { recursive: true });
          fs.writeFileSync(PLIST_PATH, generatePlist(bin), 'utf8');
          success(`launchd plist installed: ${chalk.dim(PLIST_PATH)}`);
          info('Run: profclaw daemon start');
        } else if (PLATFORM === 'linux') {
          fs.mkdirSync(path.dirname(SYSTEMD_PATH), { recursive: true });
          fs.writeFileSync(SYSTEMD_PATH, generateSystemdUnit(bin), 'utf8');
          spawnSync('systemctl', ['--user', 'daemon-reload'], { stdio: 'inherit' });
          success(`systemd unit installed: ${chalk.dim(SYSTEMD_PATH)}`);
          info('Run: profclaw daemon start');
        } else {
          warn(`Unsupported platform: ${PLATFORM}. Only macOS and Linux supported.`);
        }
      } catch (err) {
        error(err instanceof Error ? err.message : 'Install failed');
        process.exit(1);
      }
    });

  cmd
    .command('uninstall')
    .description('Remove the system service')
    .action(() => {
      try {
        if (PLATFORM === 'darwin') {
          if (fs.existsSync(PLIST_PATH)) {
            spawnSync('launchctl', ['unload', PLIST_PATH], { stdio: 'inherit' });
            fs.unlinkSync(PLIST_PATH);
            success('launchd service uninstalled');
          } else {
            info('Service not installed.');
          }
        } else if (PLATFORM === 'linux') {
          if (fs.existsSync(SYSTEMD_PATH)) {
            spawnSync('systemctl', ['--user', 'disable', '--now', 'profclaw'], { stdio: 'inherit' });
            fs.unlinkSync(SYSTEMD_PATH);
            spawnSync('systemctl', ['--user', 'daemon-reload'], { stdio: 'inherit' });
            success('systemd service uninstalled');
          } else {
            info('Service not installed.');
          }
        } else {
          warn(`Unsupported platform: ${PLATFORM}`);
        }
      } catch (err) {
        error(err instanceof Error ? err.message : 'Uninstall failed');
        process.exit(1);
      }
    });

  cmd
    .command('start')
    .description('Start the service')
    .action(() => {
      try {
        if (PLATFORM === 'darwin') {
          spawnSync('launchctl', ['load', '-w', PLIST_PATH], { stdio: 'inherit' });
          success('Service started');
        } else if (PLATFORM === 'linux') {
          spawnSync('systemctl', ['--user', 'start', 'profclaw'], { stdio: 'inherit' });
          success('Service started');
        } else {
          warn(`Unsupported platform: ${PLATFORM}`);
        }
      } catch (err) {
        error(err instanceof Error ? err.message : 'Start failed');
        process.exit(1);
      }
    });

  cmd
    .command('stop')
    .description('Stop the service')
    .action(() => {
      try {
        if (PLATFORM === 'darwin') {
          spawnSync('launchctl', ['unload', PLIST_PATH], { stdio: 'inherit' });
          success('Service stopped');
        } else if (PLATFORM === 'linux') {
          spawnSync('systemctl', ['--user', 'stop', 'profclaw'], { stdio: 'inherit' });
          success('Service stopped');
        } else {
          warn(`Unsupported platform: ${PLATFORM}`);
        }
      } catch (err) {
        error(err instanceof Error ? err.message : 'Stop failed');
        process.exit(1);
      }
    });

  cmd
    .command('status')
    .description('Show service status')
    .action(() => {
      try {
        if (PLATFORM === 'darwin') {
          const installed = fs.existsSync(PLIST_PATH);
          console.log(`  Installed: ${installed ? chalk.green('yes') : chalk.dim('no')}`);
          if (installed) {
            const out = spawnSync('launchctl', ['list', PLIST_LABEL], { encoding: 'utf8' });
            const running = out.status === 0;
            console.log(`  Running:   ${running ? chalk.green('yes') : chalk.red('no')}`);
          }
        } else if (PLATFORM === 'linux') {
          spawnSync('systemctl', ['--user', 'status', 'profclaw'], { stdio: 'inherit' });
        } else {
          warn(`Unsupported platform: ${PLATFORM}`);
        }
      } catch (err) {
        error(err instanceof Error ? err.message : 'Status check failed');
        process.exit(1);
      }
    });

  cmd
    .command('logs')
    .description('Show service logs')
    .option('-f, --follow', 'Follow log output')
    .option('-n, --lines <n>', 'Number of lines to show', '50')
    .action((options: { follow?: boolean; lines: string }) => {
      try {
        if (PLATFORM === 'darwin') {
          const logFile = path.join(os.homedir(), '.profclaw', 'daemon.log');
          if (!fs.existsSync(logFile)) { info('No log file found. Is the daemon installed?'); return; }
          const args = options.follow ? ['-f', '-n', options.lines, logFile] : ['-n', options.lines, logFile];
          spawnSync('tail', args, { stdio: 'inherit' });
        } else if (PLATFORM === 'linux') {
          const args = ['--user', '-u', 'profclaw', '--no-pager', `-n${options.lines}`];
          if (options.follow) args.push('-f');
          spawnSync('journalctl', args, { stdio: 'inherit' });
        } else {
          warn(`Unsupported platform: ${PLATFORM}`);
        }
      } catch (err) {
        error(err instanceof Error ? err.message : 'Failed to show logs');
        process.exit(1);
      }
    });

  return cmd;
}
