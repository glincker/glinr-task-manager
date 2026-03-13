import { Command } from 'commander';
import chalk from 'chalk';
import { api } from '../utils/api.js';
import { spinner, success, error, info, createTable, formatRelativeTime, truncate } from '../utils/output.js';

interface Node {
  id: string;
  url: string;
  name?: string;
  healthy: boolean;
  version?: string;
  lastSeen?: string;
  latencyMs?: number;
}

interface NodesResponse {
  nodes: Node[];
}

interface NodeAddResponse {
  node: Node;
}

interface SyncResponse {
  synced: number;
  failed: number;
}

export function nodesCommands(): Command {
  const cmd = new Command('nodes')
    .description('Manage distributed profClaw nodes');

  cmd
    .command('list')
    .alias('ls')
    .description('List connected nodes')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      const spin = spinner('Fetching nodes...').start();
      try {
        const result = await api.get<NodesResponse>('/api/nodes');
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to fetch nodes'); process.exit(1); }
        const { nodes } = result.data!;
        if (options.json) { console.log(JSON.stringify(nodes, null, 2)); return; }
        if (nodes.length === 0) { info('No nodes connected. Add one: profclaw nodes add <url>'); return; }
        const table = createTable(['ID', 'Name', 'URL', 'Version', 'Latency', 'Last Seen']);
        for (const n of nodes) {
          const healthDot = n.healthy ? chalk.green('●') : chalk.red('●');
          table.push([
            chalk.dim(truncate(n.id, 12)),
            healthDot + ' ' + (n.name || chalk.dim('-')),
            truncate(n.url, 35),
            n.version || chalk.dim('-'),
            n.latencyMs != null ? `${n.latencyMs}ms` : chalk.dim('-'),
            formatRelativeTime(n.lastSeen),
          ]);
        }
        console.log(table.toString());
        console.log(chalk.dim(`\n${nodes.length} node${nodes.length !== 1 ? 's' : ''}`));
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  cmd
    .command('add <url>')
    .description('Add a remote node by URL')
    .option('--name <name>', 'Friendly name for the node')
    .option('--json', 'Output as JSON')
    .action(async (url: string, options: { name?: string; json?: boolean }) => {
      const spin = spinner(`Adding node at ${url}...`).start();
      try {
        const result = await api.post<NodeAddResponse>('/api/nodes', { url, name: options.name });
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to add node'); process.exit(1); }
        if (options.json) { console.log(JSON.stringify(result.data, null, 2)); return; }
        const node = result.data!.node;
        success(`Node added: ${chalk.cyan(node.name || node.url)}`);
        console.log(chalk.dim(`  ID: ${node.id}`));
        if (node.version) console.log(chalk.dim(`  Version: ${node.version}`));
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  cmd
    .command('remove <id>')
    .description('Remove a node by ID')
    .option('--yes', 'Skip confirmation')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: { yes?: boolean; json?: boolean }) => {
      if (!options.yes) {
        const { createInterface } = await import('readline');
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const confirmed = await new Promise<boolean>((resolve) => {
          rl.question(`Remove node ${id}? (y/N) `, (ans) => { rl.close(); resolve(ans.toLowerCase() === 'y'); });
        });
        if (!confirmed) { info('Aborted.'); return; }
      }
      const spin = spinner('Removing node...').start();
      try {
        const result = await api.delete(`/api/nodes/${id}`);
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to remove node'); process.exit(1); }
        if (options.json) { console.log(JSON.stringify({ ok: true, id }, null, 2)); return; }
        success(`Node ${id} removed`);
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  cmd
    .command('sync')
    .description('Sync configuration across all nodes')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      const spin = spinner('Syncing nodes...').start();
      try {
        const result = await api.post<SyncResponse>('/api/nodes/sync');
        spin.stop();
        if (!result.ok) { error(result.error || 'Sync failed'); process.exit(1); }
        if (options.json) { console.log(JSON.stringify(result.data, null, 2)); return; }
        const { synced, failed } = result.data!;
        success(`Synced ${synced} node${synced !== 1 ? 's' : ''}`);
        if (failed > 0) error(`Failed to sync ${failed} node${failed !== 1 ? 's' : ''}`);
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  cmd
    .command('status [id]')
    .description('Show status for all nodes or a specific node')
    .option('--json', 'Output as JSON')
    .action(async (id: string | undefined, options: { json?: boolean }) => {
      const spin = spinner('Checking node status...').start();
      try {
        const path = id ? `/api/nodes/${id}/status` : '/api/nodes/status';
        const result = await api.get<NodesResponse | Node>(path);
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to check status'); process.exit(1); }
        if (options.json) { console.log(JSON.stringify(result.data, null, 2)); return; }
        if (id) {
          const n = result.data as Node;
          console.log(`\n${chalk.bold('Node Status')}`);
          console.log(`  ${chalk.dim('ID:')}      ${n.id}`);
          console.log(`  ${chalk.dim('URL:')}     ${n.url}`);
          console.log(`  ${chalk.dim('Healthy:')} ${n.healthy ? chalk.green('yes') : chalk.red('no')}`);
          console.log(`  ${chalk.dim('Latency:')} ${n.latencyMs != null ? `${n.latencyMs}ms` : '-'}`);
          console.log(`  ${chalk.dim('Version:')} ${n.version || '-'}`);
          console.log();
        } else {
          const { nodes } = result.data as NodesResponse;
          const healthy = nodes.filter((n) => n.healthy).length;
          console.log(`\n${chalk.bold('Node Status')}`);
          console.log(`  Total:    ${nodes.length}`);
          console.log(`  Healthy:  ${chalk.green(healthy)}`);
          console.log(`  Unhealthy: ${nodes.length - healthy > 0 ? chalk.red(nodes.length - healthy) : chalk.dim('0')}`);
          console.log();
        }
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  return cmd;
}
