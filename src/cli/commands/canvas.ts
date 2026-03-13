import { Command } from 'commander';
import chalk from 'chalk';
import { api } from '../utils/api.js';
import { spinner, success, error, info, createTable, formatRelativeTime, truncate } from '../utils/output.js';

type CanvasType = 'code' | 'chart' | 'diagram' | 'table' | 'html' | 'markdown' | 'mermaid' | 'svg';

interface CanvasItem {
  id: string;
  type: CanvasType;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

interface CanvasListResponse {
  canvases: CanvasItem[];
}

interface CanvasDetailResponse {
  canvas: CanvasItem;
  content: string;
}

interface CanvasRenderResponse {
  id: string;
  type: CanvasType;
  rendered: boolean;
}

const VALID_TYPES: CanvasType[] = ['code', 'chart', 'diagram', 'table', 'html', 'markdown', 'mermaid', 'svg'];

export function canvasCommands(): Command {
  const cmd = new Command('canvas')
    .description('Manage canvas documents');

  cmd
    .command('list')
    .alias('ls')
    .description('List canvas documents')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      const spin = spinner('Fetching canvases...').start();
      try {
        const result = await api.get<CanvasListResponse>('/api/canvas');
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to fetch canvases'); process.exit(1); }
        const { canvases } = result.data!;
        if (options.json) { console.log(JSON.stringify(canvases, null, 2)); return; }
        if (canvases.length === 0) { info('No canvas documents found.'); return; }
        const table = createTable(['ID', 'Type', 'Title', 'Updated']);
        for (const c of canvases) {
          table.push([
            chalk.dim(truncate(c.id, 12)),
            chalk.cyan(c.type),
            truncate(c.title || '-', 40),
            formatRelativeTime(c.updatedAt),
          ]);
        }
        console.log(table.toString());
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  cmd
    .command('show <id>')
    .description('Show canvas document content')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: { json?: boolean }) => {
      const spin = spinner('Fetching canvas...').start();
      try {
        const result = await api.get<CanvasDetailResponse>(`/api/canvas/${id}`);
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to fetch canvas'); process.exit(1); }
        const { canvas, content } = result.data!;
        if (options.json) { console.log(JSON.stringify(result.data, null, 2)); return; }
        console.log(`\n${chalk.bold(canvas.title || canvas.id)} ${chalk.dim(`[${canvas.type}]`)}`);
        console.log(chalk.dim('─'.repeat(50)));
        console.log(content);
        console.log();
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  cmd
    .command('render <type> <content>')
    .description(`Render content as a canvas type (${VALID_TYPES.join('|')})`)
    .option('--title <title>', 'Canvas title')
    .option('--json', 'Output as JSON')
    .action(async (type: string, content: string, options: { title?: string; json?: boolean }) => {
      if (!VALID_TYPES.includes(type as CanvasType)) {
        error(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
        process.exit(1);
      }
      const spin = spinner(`Rendering ${type} canvas...`).start();
      try {
        const result = await api.post<CanvasRenderResponse>('/api/canvas/render', {
          type,
          content,
          title: options.title,
        });
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to render canvas'); process.exit(1); }
        if (options.json) { console.log(JSON.stringify(result.data, null, 2)); return; }
        const data = result.data!;
        success(`Canvas rendered (${data.type})`);
        console.log(chalk.dim(`  ID: ${data.id}`));
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  cmd
    .command('clear [id]')
    .description('Clear canvas document(s)')
    .option('--yes', 'Skip confirmation')
    .option('--json', 'Output as JSON')
    .action(async (id: string | undefined, options: { yes?: boolean; json?: boolean }) => {
      if (!options.yes) {
        const { createInterface } = await import('readline');
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const label = id ? `canvas ${id}` : 'all canvases';
        const confirmed = await new Promise<boolean>((resolve) => {
          rl.question(`Clear ${label}? (y/N) `, (ans) => { rl.close(); resolve(ans.toLowerCase() === 'y'); });
        });
        if (!confirmed) { info('Aborted.'); return; }
      }
      const spin = spinner('Clearing canvas...').start();
      try {
        const path = id ? `/api/canvas/${id}` : '/api/canvas';
        const result = await api.delete(path);
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to clear canvas'); process.exit(1); }
        if (options.json) { console.log(JSON.stringify({ ok: true }, null, 2)); return; }
        success(id ? `Canvas ${id} cleared` : 'All canvases cleared');
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  return cmd;
}
