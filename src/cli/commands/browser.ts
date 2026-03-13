import { Command } from 'commander';
import chalk from 'chalk';
import { api } from '../utils/api.js';
import { spinner, success, error, info, createTable, truncate } from '../utils/output.js';

interface BrowserPage {
  id: string;
  url: string;
  title: string;
  active: boolean;
}

interface BrowserPagesResponse {
  pages: BrowserPage[];
}

interface BrowserOpenResponse {
  pageId: string;
  url: string;
}

interface BrowserScreenshotResponse {
  path?: string;
  base64?: string;
  url: string;
}

export function browserCommands(): Command {
  const cmd = new Command('browser')
    .description('Control CDP browser sessions');

  cmd
    .command('open <url>')
    .description('Open a URL in the browser')
    .option('--json', 'Output as JSON')
    .action(async (url: string, options: { json?: boolean }) => {
      const spin = spinner(`Opening ${url}...`).start();
      try {
        const result = await api.post<BrowserOpenResponse>('/api/browser/open', { url });
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to open URL'); process.exit(1); }
        if (options.json) { console.log(JSON.stringify(result.data, null, 2)); return; }
        const data = result.data!;
        success(`Opened ${chalk.cyan(data.url)}`);
        console.log(chalk.dim(`  Page ID: ${data.pageId}`));
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  cmd
    .command('screenshot [url]')
    .description('Take a screenshot of the current page or a URL')
    .option('--output <path>', 'Save screenshot to file path')
    .option('--json', 'Output as JSON')
    .action(async (url: string | undefined, options: { output?: string; json?: boolean }) => {
      const spin = spinner('Taking screenshot...').start();
      try {
        const body: Record<string, string> = {};
        if (url) body['url'] = url;
        if (options.output) body['outputPath'] = options.output;
        const result = await api.post<BrowserScreenshotResponse>('/api/browser/screenshot', body);
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to take screenshot'); process.exit(1); }
        if (options.json) { console.log(JSON.stringify(result.data, null, 2)); return; }
        const data = result.data!;
        success('Screenshot taken');
        if (data.path) console.log(chalk.dim(`  Saved to: ${data.path}`));
        if (data.url) console.log(chalk.dim(`  Page: ${data.url}`));
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  cmd
    .command('close [pageId]')
    .description('Close browser page or all pages')
    .option('--json', 'Output as JSON')
    .action(async (pageId: string | undefined, options: { json?: boolean }) => {
      const spin = spinner('Closing browser...').start();
      try {
        const path = pageId ? `/api/browser/pages/${pageId}` : '/api/browser/close';
        const result = await api.post(path);
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to close browser'); process.exit(1); }
        if (options.json) { console.log(JSON.stringify(result.data, null, 2)); return; }
        success(pageId ? `Page ${pageId} closed` : 'Browser closed');
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  cmd
    .command('pages')
    .description('List open browser pages')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      const spin = spinner('Fetching pages...').start();
      try {
        const result = await api.get<BrowserPagesResponse>('/api/browser/pages');
        spin.stop();
        if (!result.ok) { error(result.error || 'Failed to fetch pages'); process.exit(1); }
        const { pages } = result.data!;
        if (options.json) { console.log(JSON.stringify(pages, null, 2)); return; }
        if (pages.length === 0) { info('No open browser pages.'); return; }
        const table = createTable(['ID', 'Title', 'URL', 'Active']);
        for (const p of pages) {
          table.push([
            chalk.dim(truncate(p.id, 12)),
            truncate(p.title || '-', 30),
            truncate(p.url, 40),
            p.active ? chalk.green('yes') : chalk.dim('no'),
          ]);
        }
        console.log(table.toString());
      } catch (err) {
        spin.stop();
        error(err instanceof Error ? err.message : 'Unknown error');
        process.exit(1);
      }
    });

  return cmd;
}
