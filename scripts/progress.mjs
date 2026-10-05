import { createHash } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = resolve(root, 'docs/progress');
const output = resolve(directory, 'index.html');
const sourceDocuments = [
  ['公開・価値検証ロードマップ', 'docs/roadmap.md'],
  ['公開MVPの範囲', 'docs/mvp.md'],
  ['配置候補・費用と公開残件', 'docs/release.md'],
  ['Netlify候補のAPI入口と検証', 'docs/netlify.md'],
  ['バックアップ・別DB復元', 'docs/backup.md'],
  ['無料βの公開案内原稿', 'docs/beta-notice.md'],
  ['無料βの計測・実験基準', 'docs/beta-metrics.md'],
  ['STEP 06の生成・採用契約案（未提供）', 'docs/ai-quests.md'],
  ['バックエンドの作業順', 'docs/backend-roadmap.md'],
  ['進捗の更新方法', 'docs/progress/README.md'],
  ['今回の進捗表の確認結果', 'docs/progress/review/README.md'],
];
const statuses = new Set(['todo', 'doing', 'verify', 'done', 'blocked']);
const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};
const requireText = (value, label) =>
  requireCondition(
    typeof value === 'string' && value.trim().length > 0,
    `${label}: 空の文字列です`,
  );
const read = async (path) =>
  (await readFile(path, 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

async function validate(data) {
  requireCondition(data.schemaVersion === 1, 'schemaVersion: 未対応の版です');
  for (const key of [
    'updatedAt',
    'snapshotLabel',
    'baseRevision',
    'currentTaskId',
    'activity',
    'runtime',
  ]) {
    requireText(data[key], key);
  }
  requireCondition(
    !Number.isNaN(Date.parse(data.updatedAt)),
    'updatedAt: 不正な日時です',
  );
  requireCondition(
    /^[a-f0-9]{7,40}$/.test(data.baseRevision),
    'baseRevision: 不正なGit版です',
  );
  for (const key of [
    'steps',
    'evidence',
    'phases',
    'flows',
    'routes',
    'gates',
  ]) {
    requireCondition(
      Array.isArray(data[key]) && data[key].length > 0,
      `${key}: 空の一覧です`,
    );
  }
  const ids = new Set();
  const unique = (id, label) => {
    requireCondition(!ids.has(id), `${label}: IDが重複しています`);
    ids.add(id);
  };
  const references = new Set();
  const evidenceIds = new Set();
  for (const record of data.evidence) {
    requireCondition(/^E\d+$/.test(record.id), 'evidence: 不正なIDです');
    unique(record.id, 'evidence');
    evidenceIds.add(record.id);
    for (const key of [
      'title',
      'date',
      'revision',
      'method',
      'result',
      'limit',
    ]) {
      requireText(record[key], `evidence.${key}`);
    }
    requireCondition(
      Array.isArray(record.sources) && record.sources.length > 0,
      'evidence.sources: 空です',
    );
    for (const source of record.sources) {
      requireText(source, 'evidence.source');
      if (source.startsWith('https://github.com/')) {
        const url = new URL(source);
        requireCondition(
          url.protocol === 'https:' &&
            url.hostname === 'github.com' &&
            !url.username &&
            !url.password,
          'evidence.source: 不正なURLです',
        );
      } else {
        requireCondition(
          !source.includes(':') &&
            !source.includes('\\') &&
            !source.includes('..'),
          'evidence.source: 不正なローカル参照です',
        );
        references.add(source);
      }
    }
  }
  let currentTask;
  let currentTaskStep;
  let total = 0;
  let done = 0;
  data.steps.forEach((step, index) => {
    requireCondition(
      step.id === index + 1,
      'steps: 工程IDは1からの連番にしてください',
    );
    unique(`step-${step.id}`, 'step');
    for (const key of ['title', 'short', 'outcome'])
      requireText(step[key], `step.${key}`);
    requireCondition(
      Array.isArray(step.groups) && step.groups.length > 0,
      'step.groups: 空です',
    );
    step.groups.forEach((group, groupIndex) => {
      const groupId = `${String(step.id).padStart(2, '0')}.${groupIndex + 1}`;
      requireCondition(
        group.id === groupId,
        'group: 工程と中項目のIDが一致しません',
      );
      unique(group.id, 'group');
      requireText(group.title, 'group.title');
      requireCondition(
        Array.isArray(group.tasks) && group.tasks.length > 0,
        'group.tasks: 空です',
      );
      group.tasks.forEach((task, taskIndex) => {
        requireCondition(
          task.id === `${group.id}.${taskIndex + 1}`,
          'task: 階層とIDが一致しません',
        );
        unique(task.id, 'task');
        for (const key of ['title', 'acceptance'])
          requireText(task[key], `task.${key}`);
        requireCondition(
          statuses.has(task.status),
          'task.status: 未定義の状態です',
        );
        requireCondition(
          Array.isArray(task.evidence),
          'task.evidence: 配列が必要です',
        );
        requireCondition(
          task.status !== 'done' || task.evidence.length > 0,
          'task.evidence: 完了根拠がありません',
        );
        task.evidence.forEach((id) => {
          requireCondition(
            evidenceIds.has(id),
            'task.evidence: 参照先がありません',
          );
        });
        requireCondition(
          task.issue === null ||
            (Number.isInteger(task.issue) && task.issue > 0),
          'task.issue: 正の整数またはnullにしてください',
        );
        total += 1;
        if (task.status === 'done') done += 1;
        if (task.id === data.currentTaskId) {
          currentTask = task;
          currentTaskStep = step.id;
        }
      });
    });
  });
  requireCondition(
    currentTask &&
      currentTaskStep === data.currentStep &&
      currentTask.status !== 'done',
    'currentTaskId: 現在工程の未完了項目を指定してください',
  );
  requireCondition(
    data.steps.some((step) => step.id === 5),
    '無料βまでの集計にはSTEP 05が必要です',
  );
  const validSteps = new Set(data.steps.map((step) => step.id));
  for (const phase of data.phases) {
    requireText(phase.title, 'phase.title');
    requireText(phase.note, 'phase.note');
    requireCondition(
      Array.isArray(phase.steps) &&
        phase.steps.length > 0 &&
        phase.steps.every((id) => validSteps.has(id)),
      'phase.steps: 参照先がありません',
    );
  }
  for (const flow of data.flows) {
    for (const key of ['title', 'description', 'exception'])
      requireText(flow[key], `flow.${key}`);
    requireCondition(
      Array.isArray(flow.steps) &&
        flow.steps.length > 0 &&
        flow.steps.every((id) => validSteps.has(id)),
      'flow.steps: 参照先がありません',
    );
  }
  for (const route of data.routes) {
    requireCondition(/^R\d+$/.test(route.id), 'route.id: 不正なIDです');
    unique(route.id, 'route');
    for (const key of ['screen', 'route', 'status', 'next'])
      requireText(route[key], `route.${key}`);
    requireCondition(
      validSteps.has(route.step),
      'route.step: 参照先がありません',
    );
  }
  for (const gate of data.gates) {
    requireText(gate.title, 'gate.title');
    requireCondition(
      Array.isArray(gate.items) && gate.items.length > 0,
      'gate.items: 空です',
    );
    for (const item of gate.items) {
      for (const key of ['title', 'status', 'note'])
        requireText(item[key], `gate.${key}`);
    }
  }
  for (const path of references) {
    const target = resolve(root, path);
    requireCondition(
      !relative(root, target).startsWith('..') && (await stat(target)).isFile(),
      'evidence.source: ファイルが見つかりません',
    );
  }
  return { steps: data.steps.length, total, done };
}

async function generate() {
  const [json, template, style, client, sources] = await Promise.all([
    read(resolve(directory, 'tasks.json')),
    read(resolve(directory, 'template.html')),
    read(resolve(directory, 'style.css')),
    read(resolve(directory, 'client.js')),
    Promise.all(
      sourceDocuments.map(async ([title, path]) => ({
        title,
        path,
        text: await read(resolve(root, path)),
      })),
    ),
  ]);
  const data = JSON.parse(json);
  const result = await validate(data);
  const embedded = JSON.stringify({ ...data, sources })
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  const hash = (value) => createHash('sha256').update(value).digest('base64');
  const csp = `default-src 'none'; script-src 'sha256-${hash(client)}'; style-src 'sha256-${hash(style)}'; img-src data:; connect-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`;
  let html = template;
  for (const [token, value] of [
    ['CSP', csp],
    ['STYLE', style],
    ['DATA', embedded],
    ['CLIENT', client],
  ]) {
    const placeholder = {
      CSP: '{{CSP}}',
      STYLE: '/* {{STYLE}} */',
      DATA: '"{{DATA}}"',
      CLIENT: '/* {{CLIENT}} */',
    }[token];
    requireCondition(
      html.split(placeholder).length === 2,
      `template: ${token}は1箇所にしてください`,
    );
    html = html.replace(placeholder, () => value);
  }
  return { html, result };
}

async function main() {
  const mode = process.argv[2];
  requireCondition(
    ['build', 'check', 'serve'].includes(mode) && process.argv.length === 3,
    '使い方: node scripts/progress.mjs build|check|serve',
  );
  const { html, result } = await generate();
  if (mode === 'check') {
    requireCondition(
      (await read(output)) === html,
      'index.htmlが正本と一致しません。pnpm progress:buildを実行してください',
    );
    console.log(
      `進捗表の整合確認成功: ${result.steps} STEP / ${result.total}小項目 / 完了${result.done}`,
    );
    return;
  }
  await writeFile(output, html, 'utf8');
  if (mode === 'build') {
    console.log(
      `docs/progress/index.htmlを生成: ${result.steps} STEP / ${result.total}小項目 / 完了${result.done}`,
    );
    return;
  }
  const server = createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    const pathname = new URL(request.url, 'http://127.0.0.1:4318').pathname;
    if (!['/', '/index.html'].includes(pathname)) {
      response.writeHead(404);
      response.end();
      return;
    }
    try {
      const next = await generate();
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : next.html);
    } catch {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(
        '進捗の生成に失敗しました。pnpm progress:checkで正本を確認してください。',
      );
    }
  });
  server.on('error', (error) => {
    console.error(
      error.code === 'EADDRINUSE'
        ? '4318番ポートは使用中です。既存の進捗サーバーを確認してください。'
        : '進捗サーバーを起動できませんでした。',
    );
    process.exitCode = 1;
  });
  server.listen(4318, '127.0.0.1', () =>
    console.log('進捗表: http://127.0.0.1:4318/（終了: Ctrl+C）'),
  );
}

main().catch((error) => {
  console.error(`進捗表: ${error.message}`);
  process.exitCode = 1;
});
