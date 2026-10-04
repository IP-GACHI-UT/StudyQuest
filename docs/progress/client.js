(() => {
  const data = JSON.parse(document.getElementById('progress-data').textContent);
  const labels = {
    done: '完了・根拠あり',
    doing: '対応中',
    verify: '検証待ち',
    todo: '未着手',
    blocked: '要判断・保留',
  };
  const symbols = {
    done: '✓',
    doing: '◉',
    verify: '◷',
    todo: '○',
    blocked: '!',
  };
  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character],
    );
  const pad = (value) => String(value).padStart(2, '0');
  const tasksOf = (step) => step.groups.flatMap((group) => group.tasks);
  const allTasks = data.steps.flatMap(tasksOf);
  const count = (tasks, status) =>
    tasks.filter((task) => task.status === status).length;
  const percent = (tasks) =>
    Math.round((count(tasks, 'done') / tasks.length) * 100);
  const stats = (step) => {
    const tasks = tasksOf(step);
    return {
      total: tasks.length,
      done: count(tasks, 'done'),
      percent: percent(tasks),
    };
  };
  const current = data.steps.find((step) => step.id === data.currentStep);
  const state = {
    filter: 'all',
    query: '',
    selectedStep: data.currentStep,
    openSteps: new Set([data.currentStep]),
  };
  const totalDone = count(allTasks, 'done');
  const completeSteps = data.steps.filter(
    (step) => stats(step).percent === 100,
  ).length;
  const stepLabel = (step) => {
    const tasks = tasksOf(step);
    if (tasks.every((task) => task.status === 'done'))
      return '記載範囲の確認完了';
    if (tasks.some((task) => task.status === 'blocked'))
      return '要判断・保留あり';
    if (tasks.some((task) => task.status === 'doing')) return '対応中';
    if (tasks.some((task) => task.status === 'verify')) return '検証待ちあり';
    return step.id === data.currentStep ? '次に進める工程' : '未着手';
  };
  const badge = (status) =>
    `<span class="badge ${escapeHtml(status)}">${escapeHtml(labels[status])}</span>`;
  const stepButtons = (ids) =>
    ids
      .map(
        (id) =>
          `<button type="button" data-step="${id}">STEP ${pad(id)}</button>`,
      )
      .join('');

  byId('overall-value').textContent = `${percent(allTasks)}%`;
  byId('overall-count').textContent =
    `${totalDone} / ${allTasks.length} 小項目完了`;
  byId('overall-bar').value = percent(allTasks);
  byId('header-step-count').textContent =
    `${completeSteps} / ${data.steps.length} STEP完了`;
  byId('updated').textContent = `記録更新 ${new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(data.updatedAt))} JST`;
  byId('revision').textContent = `基準版 ${data.baseRevision}`;
  byId('snapshot').textContent = data.snapshotLabel;
  const betaTasks = data.steps.filter((step) => step.id <= 5).flatMap(tasksOf);
  byId('beta-count').textContent =
    `${percent(betaTasks)}% · ${count(betaTasks, 'done')} / ${betaTasks.length} 小項目`;
  byId('beta-bar').value = percent(betaTasks);
  byId('step-strip').innerHTML = data.steps
    .map((step) => {
      const result = stats(step);
      return `<button type="button" class="strip-item ${step.id === data.currentStep ? 'is-current' : ''}" data-step="${step.id}" aria-label="STEP ${pad(step.id)} ${escapeHtml(step.short)}、${result.percent}%、${escapeHtml(stepLabel(step))}"><span class="strip-label"><span>${pad(step.id)}</span><span>${result.percent}%</span></span><progress value="${result.percent}" max="100" aria-label="STEP ${pad(step.id)}の完了率"></progress></button>`;
    })
    .join('');
  function renderNavigation() {
    byId('sidebar-steps').innerHTML = data.steps
      .map((step) => {
        const result = stats(step);
        const selected = step.id === state.selectedStep;
        return `<button type="button" class="side-step ${selected ? 'active' : ''} ${result.percent === 100 ? 'done' : ''}" data-step="${step.id}" ${selected ? 'aria-current="step"' : ''}><span class="side-number">${pad(step.id)}</span><span>${escapeHtml(step.short)}</span><span class="side-percent">${result.percent}%</span></button>`;
      })
      .join('');
  }
  const metrics = [
    [
      'all',
      '全タスク',
      allTasks.length,
      `${data.steps.length} STEP / ${data.steps.reduce((sum, step) => sum + step.groups.length, 0)} 中項目`,
    ],
    ['done', '完了・根拠あり', totalDone, '記載した確認範囲の完了'],
    [
      'remaining',
      '残りのタスク',
      allTasks.length - totalDone,
      '未着手・対応中・検証待ち',
    ],
    ['verify', '検証待ち', count(allTasks, 'verify'), '実装後の確認が必要'],
    ['todo', '未着手', count(allTasks, 'todo'), '計画上の残りの小項目'],
  ];
  byId('summary').innerHTML = metrics
    .map(
      ([filter, title, number, note]) =>
        `<button type="button" class="metric" data-filter="${filter}" aria-label="${escapeHtml(title)} ${number}件で絞り込む"><span class="metric-label">${escapeHtml(title)}</span><span class="metric-number">${number}</span><span class="metric-unit">件</span><span class="metric-note">${escapeHtml(note)}</span></button>`,
    )
    .join('');
  byId('focus-title').textContent = `STEP ${pad(current.id)}　${current.short}`;
  byId('activity').textContent = data.activity;
  byId('runtime').textContent = `記録の範囲：${data.runtime}`;
  const upcoming = [
    allTasks.find((task) => task.id === data.currentTaskId),
    ...tasksOf(current).filter(
      (task) => task.status !== 'done' && task.id !== data.currentTaskId,
    ),
  ]
    .filter(Boolean)
    .slice(0, 3);
  byId('next-tasks').innerHTML = upcoming
    .map((task) => `<li>${escapeHtml(task.title)}</li>`)
    .join('');

  function matches(task, step, group) {
    const matchingState =
      state.filter === 'all' ||
      (state.filter === 'remaining' && task.status !== 'done') ||
      (state.filter === 'current' && step.id === data.currentStep) ||
      task.status === state.filter;
    const text = `${step.title} ${group.title} ${task.id} ${task.title} ${task.acceptance} ${labels[task.status]}`;
    return (
      matchingState &&
      text.toLocaleLowerCase().includes(state.query.toLocaleLowerCase())
    );
  }
  function renderFilters() {
    const filters = [
      ['all', 'すべて', allTasks.length],
      ['remaining', '残りだけ', allTasks.length - totalDone],
      ['current', '次に進めるSTEP', tasksOf(current).length],
      ['verify', '検証待ち', count(allTasks, 'verify')],
      ['todo', '未着手', count(allTasks, 'todo')],
      ['done', '完了', totalDone],
    ];
    if (count(allTasks, 'doing'))
      filters.push(['doing', '対応中', count(allTasks, 'doing')]);
    if (count(allTasks, 'blocked'))
      filters.push(['blocked', '要判断・保留', count(allTasks, 'blocked')]);
    byId('filters').innerHTML = filters
      .map(
        ([filter, title, number]) =>
          `<button type="button" data-filter="${filter}" aria-pressed="${state.filter === filter}">${title}<span>${number}</span></button>`,
      )
      .join('');
  }
  function taskMarkup(task) {
    const evidence = task.evidence.map((id) =>
      data.evidence.find((record) => record.id === id),
    );
    const issue = task.issue
      ? `<p><a href="https://github.com/IP-GACHI-UT/StudyQuest/issues/${task.issue}" target="_blank" rel="noopener noreferrer">関連Issue #${task.issue}</a>（Issueの状態とこの小項目の完了は別判定）</p>`
      : '';
    return `<details class="task" data-status="${escapeHtml(task.status)}" id="task-${task.id}"><summary><span class="task-symbol" aria-hidden="true">${symbols[task.status]}</span><span><span class="task-id">${task.id}</span>${escapeHtml(task.title)}</span>${badge(task.status)}</summary><div class="task-detail"><p><strong>完了条件</strong><br>${escapeHtml(task.acceptance)}</p>${issue}${evidence.length ? `<p><strong>記録された根拠</strong><br>${evidence.map((record) => `<button type="button" class="evidence-chip" data-evidence="${record.id}">${record.id} ${escapeHtml(record.title)}</button>`).join('')}</p>` : '<p>この小項目の完了根拠はまだ記録されていません。</p>'}${task.status === 'verify' ? '<p>上の根拠は実装の存在確認です。完了条件にある実動作の確認が残っています。</p>' : ''}</div></details>`;
  }
  function renderTasks() {
    let visible = 0;
    let visibleSteps = 0;
    byId('task-list').innerHTML =
      data.steps
        .map((step) => {
          const groups = step.groups
            .map((group) => ({
              ...group,
              visibleTasks: group.tasks.filter((task) =>
                matches(task, step, group),
              ),
            }))
            .filter((group) => group.visibleTasks.length);
          if (!groups.length) return '';
          visibleSteps += 1;
          visible += groups.reduce(
            (sum, group) => sum + group.visibleTasks.length,
            0,
          );
          const result = stats(step);
          const open =
            state.openSteps.has(step.id) ||
            state.query ||
            state.filter !== 'all';
          return `<details id="step-${step.id}" class="step-card ${step.id === data.currentStep ? 'current' : ''} ${result.percent === 100 ? 'complete' : ''}" ${open ? 'open' : ''}><summary class="step-summary"><span class="step-index">${pad(step.id)}</span><span><span class="step-title" role="heading" aria-level="2">STEP ${pad(step.id)}　${escapeHtml(step.title)}</span><span class="step-subtitle">${step.groups.length} 中項目 / ${result.total} 小項目　｜　${escapeHtml(stepLabel(step))}</span></span><span class="step-progress"><span><span>${result.done} / ${result.total} 完了</span><strong>${result.percent}%</strong></span><progress value="${result.percent}" max="100" aria-label="STEP ${pad(step.id)}の完了率"></progress></span><span class="chevron" aria-hidden="true">›</span></summary><div class="step-body"><p class="step-outcome"><b>このSTEPの到達点</b>${escapeHtml(step.outcome)}</p>${groups.map((group) => `<section class="task-group"><div class="group-heading"><h3><span>${group.id}</span>${escapeHtml(group.title)}</h3><span class="group-count">${count(group.tasks, 'done')} / ${group.tasks.length} 小項目完了</span></div>${group.visibleTasks.map(taskMarkup).join('')}</section>`).join('')}</div></details>`;
        })
        .join('') ||
      '<div class="empty"><strong>一致するタスクがありません。</strong><p>検索語や状態を変えると、ほかのタスクを表示できます。</p><button type="button" class="quiet-button" data-reset>絞り込みを解除する</button></div>';
    byId('result-count').textContent =
      `${visible} / ${allTasks.length} 小項目を表示・${visibleSteps} STEP`;
  }
  function showView(view) {
    document.querySelectorAll('.view').forEach((element) => {
      element.hidden = element.id !== `${view}-view`;
    });
    document.querySelectorAll('[data-view]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.view === view));
    });
  }
  function setFilter(filter) {
    state.filter = filter;
    showView('tasks');
    renderFilters();
    renderTasks();
  }
  function selectStep(id) {
    state.query = '';
    state.selectedStep = id;
    byId('task-search').value = '';
    state.openSteps.add(id);
    setFilter('all');
    renderNavigation();
    const card = byId(`step-${id}`);
    card.querySelector('summary').focus({ preventScroll: true });
    card.scrollIntoView({ block: 'start' });
  }

  byId('flows-view').innerHTML =
    `<h2 class="section-heading">無料βから、価値と需要の検証へ</h2><p class="section-description">全部を完成させてから公開する計画を改め、まず学習の基本体験を届けます。後続のAI・課金は反応を見て進めます。</p><div class="phase-grid">${data.phases.map((phase) => `<section class="phase"><h3>${escapeHtml(phase.title)}</h3><p>${escapeHtml(phase.note)}</p>${stepButtons(phase.steps)}</section>`).join('')}</div><h2 class="section-heading">学習者の体験を一本につなぐ</h2><p class="section-description">既存のクエスト・学習記録・XPを土台に、今日の行動と継続を支えます。</p><div class="journey">${data.flows.map((flow) => `<article class="journey-card"><div class="journey-content"><h3>${escapeHtml(flow.title)}</h3><p>${escapeHtml(flow.description)}</p><div class="journey-links">${stepButtons(flow.steps)}</div><p class="exception">${escapeHtml(flow.exception)}</p></div></article>`).join('')}</div><div class="inline-note">Storybook/MSWによる状態再現、共通UI、機能ごとの実DB・画面検証など、tegal-cpの進め方を参考にします。導入するものは後続Issueで絞り、StudyQuestのHono APIとPrisma/PostgreSQLを維持します。</div>`;
  byId('routes-view').innerHTML =
    `<h2 class="section-heading">画面とAPI、いま残る接続</h2><p class="section-description">基準版のコードから、実データ・仮表示・未接続を整理した${data.routes.length}件の対応表です。APIの存在と画面の完走は別に確認します。</p><label class="search-box"><span>画面・APIを検索</span><input id="route-search" type="search" placeholder="例：タイマー、profile、R05" autocomplete="off"></label><p id="route-count" class="route-meta" role="status" aria-live="polite"></p><div class="table-wrap"><table><caption class="route-meta">基準版 ${escapeHtml(data.baseRevision)}の画面・API対応</caption><thead><tr><th scope="col">ID</th><th scope="col">画面</th><th scope="col">対応API・導線</th><th scope="col">現在地</th><th scope="col">次の作業</th></tr></thead><tbody id="route-rows"></tbody></table></div>`;
  function renderRoutes(query = '') {
    const routes = data.routes.filter((route) =>
      Object.values(route)
        .join(' ')
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
    );
    byId('route-count').textContent =
      `${routes.length} / ${data.routes.length} 件を表示`;
    byId('route-rows').innerHTML =
      routes
        .map(
          (route) =>
            `<tr><td data-label="ID">${route.id}</td><td data-label="画面">${escapeHtml(route.screen)}</td><td data-label="対応API・導線"><code>${escapeHtml(route.route)}</code></td><td data-label="現在地">${escapeHtml(route.status)}</td><td data-label="次の作業">${escapeHtml(route.next)}<div class="journey-links">${stepButtons([route.step])}</div></td></tr>`,
        )
        .join('') ||
      '<tr><td colspan="5">一致する画面・APIはありません。</td></tr>';
  }
  byId('gates-view').innerHTML =
    `<h2 class="section-heading">公開・実接続の前に確認すること</h2><p class="section-description">ローカルの実装準備と、外部環境での確認・提供条件の決定を分けています。この一覧は上部の小項目へ重複加算しません。</p>${data.gates.map((group) => `<section class="gate-group"><h3>${escapeHtml(group.title)}</h3>${group.items.map((item) => `<div class="gate-row"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.status)}</span><p>${escapeHtml(item.note)}</p></div>`).join('')}</section>`).join('')}<div class="inline-note">無料に近い固定費と月480〜680円のPlusは検討仮説です。価格・無料枠・商用条件・AI入力の扱いは契約前に再確認します。加入意向のクリックを売上として扱いません。</div>`;
  function evidenceMarkup(record) {
    return `<article class="evidence-card" id="evidence-${record.id}" tabindex="-1"><h3><span>${record.id}</span>${escapeHtml(record.title)}</h3><p><code>${escapeHtml(record.date)} / ${escapeHtml(record.revision)}</code></p><p><strong>確認方法：</strong>${escapeHtml(record.method)}</p><p>${escapeHtml(record.result)}</p><p class="limit"><strong>この根拠の範囲：</strong>${escapeHtml(record.limit)}</p><ul>${record.sources.map((source) => `<li>${source.startsWith('https://') ? `<a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source)}</a>` : `<code>${escapeHtml(source)}</code>`}</li>`).join('')}</ul></article>`;
  }
  byId('evidence-view').innerHTML =
    `<h2 class="section-heading">完了の根拠と、記録の更新方法</h2><p class="section-description">初期の完了4項目はコード・Issue・定義の棚卸しです。実DBの動作や本番公開の確認とは区別しています。</p><div class="update-guide"><h3>このページの更新</h3><ol><li><code>docs/progress/tasks.json</code>の状態・完了根拠・現在項目・更新日時を更新します。</li><li>計画や公開範囲が変わったら、ロードマップ・MVPなどの正本も更新します。</li><li><code>pnpm progress:build</code>で単体HTMLを再生成し、<code>pnpm progress:check</code>で一致を確認します。</li><li>「最新の記録を読み直す」で表示を更新します。</li></ol><p><code>pnpm progress:serve</code>は127.0.0.1:4318だけで表示し、要求時に再生成します。単体HTMLもネットワークなしで閲覧できます。</p><p>進捗＝完了した小項目数÷全小項目数。未着手・対応中・検証待ちを部分加点しません。ブラウザ上の操作で状態を変更する機能はありません。</p></div>${data.evidence.map(evidenceMarkup).join('')}<h2 class="section-heading">生成時点の計画・正本</h2><p class="section-description">参照文書の本文を同梱しているので、単体HTMLでも確認できます。</p>${data.sources.map((source) => `<details class="source-doc"><summary>${escapeHtml(source.title)} <span class="route-meta">${escapeHtml(source.path)}</span></summary><pre>${escapeHtml(source.text)}</pre></details>`).join('')}`;

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.step) selectStep(Number(button.dataset.step));
    if (button.dataset.view) showView(button.dataset.view);
    if (button.dataset.filter) {
      const filter = button.dataset.filter;
      setFilter(filter);
      byId('filters')
        .querySelector(`[data-filter="${filter}"]`)
        .focus({ preventScroll: true });
    }
    if (button.hasAttribute('data-reset')) {
      state.query = '';
      byId('task-search').value = '';
      setFilter('all');
      byId('task-search').focus();
    }
    if (button.dataset.evidence) {
      showView('evidence');
      const article = byId(`evidence-${button.dataset.evidence}`);
      article.focus({ preventScroll: true });
      article.scrollIntoView({ block: 'start' });
    }
  });
  byId('task-search').addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    renderTasks();
  });
  byId('route-search').addEventListener('input', (event) =>
    renderRoutes(event.target.value.trim()),
  );
  byId('task-list').addEventListener(
    'toggle',
    (event) => {
      if (
        !(event.target instanceof HTMLDetailsElement) ||
        !event.target.classList.contains('step-card')
      )
        return;
      const id = Number(event.target.id.replace('step-', ''));
      if (event.target.open) state.openSteps.add(id);
      else state.openSteps.delete(id);
    },
    true,
  );
  byId('expand-all').addEventListener('click', () => {
    byId('task-list')
      .querySelectorAll('details')
      .forEach((details) => {
        details.open = true;
      });
    data.steps.forEach((step) => {
      state.openSteps.add(step.id);
    });
  });
  byId('collapse-all').addEventListener('click', () => {
    byId('task-list')
      .querySelectorAll('details')
      .forEach((details) => {
        details.open = false;
      });
    state.openSteps.clear();
  });
  byId('go-current').addEventListener('click', () =>
    selectStep(data.currentStep),
  );
  byId('reload').addEventListener('click', () => window.location.reload());
  renderNavigation();
  renderFilters();
  renderTasks();
  renderRoutes();
})();
