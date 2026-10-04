'use client';
import { useEffect, useRef, useState } from 'react';
import {
  AuthenticationRequiredError,
  apiRequest,
  currentLoginHref,
  type StudyLogDraft,
} from '@/lib/api';

export function StudyTimer({
  questId,
  afterSave,
}: {
  questId: string;
  afterSave: () => void;
}) {
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(0);
  const locked = useRef(false);
  const draft = useRef<StudyLogDraft | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finishedAt, setFinishedAt] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(1);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginHref, setLoginHref] = useState<string | null>(null);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setElapsed(
        accumulated.current +
          (startedAt.current === null
            ? 0
            : performance.now() - startedAt.current),
      );
    }, 250);
    return () => window.clearInterval(timer);
  }, [running]);
  function start() {
    if (startedAt.current !== null || finishedAt) return;
    startedAt.current = performance.now();
    setRunning(true);
  }
  function pause() {
    if (startedAt.current !== null) {
      accumulated.current += performance.now() - startedAt.current;
      startedAt.current = null;
    }
    setElapsed(accumulated.current);
    setRunning(false);
    return accumulated.current;
  }
  function finish() {
    const duration = pause();
    setMinutes(Math.max(1, Math.ceil(duration / 60_000)));
    setFinishedAt(new Date().toISOString());
  }
  async function save() {
    if (locked.current || saved || !finishedAt) return;
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      setError('学習時間は1〜1440分の整数で指定してください。');
      return;
    }
    locked.current = true;
    draft.current ??= {
      requestId: crypto.randomUUID(),
      questId,
      minutes,
      note,
      studiedAt: finishedAt,
    };
    setSubmitted(true);
    setSaving(true);
    setError(null);
    setLoginHref(null);
    try {
      await apiRequest('/study-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft.current),
      });
      setSaved(true);
      afterSave();
    } catch (cause) {
      if (cause instanceof AuthenticationRequiredError)
        setLoginHref(currentLoginHref());
      setError(
        `${cause instanceof Error ? cause.message : '保存に失敗しました。'} 入力は保持しています。同じ内容で再試行できます。`,
      );
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }
  const seconds = Math.floor(elapsed / 1000);
  return (
    <section className="rounded-xl border bg-white p-6 text-gray-900">
      <h2 className="text-lg font-bold">学習タイマー</h2>
      <p
        role="timer"
        className="my-6 text-center font-mono text-4xl"
        aria-label="計測時間"
      >
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:
        {String(seconds % 60).padStart(2, '0')}
      </p>
      {!finishedAt ? (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={running ? pause : start}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            {running ? '一時停止' : elapsed > 0 ? '再開' : '開始'}
          </button>
          <button
            type="button"
            onClick={finish}
            disabled={elapsed === 0 && !running}
            className="rounded-lg border px-5 py-2 disabled:opacity-50"
          >
            終了して記録
          </button>
        </div>
      ) : saved ? (
        <p role="status">
          学習記録を保存しました。次の学習はマイクエストから開始できます。
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          className="space-y-4"
        >
          <p className="text-sm text-gray-600">
            端数は1分へ切り上げます。時間とメモを確認して保存してください。
          </p>
          <label className="block">
            学習時間（分）
            <input
              type="number"
              min={1}
              max={1440}
              step={1}
              required
              value={Number.isNaN(minutes) ? '' : minutes}
              onChange={(event) =>
                setMinutes(event.currentTarget.valueAsNumber)
              }
              disabled={saving || submitted}
              className="mt-1 block w-full rounded border p-2"
            />
          </label>
          <label className="block">
            学習メモ（任意）
            <textarea
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              disabled={saving || submitted}
              className="mt-1 block w-full rounded border p-2"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
          >
            {saving
              ? '保存中...'
              : submitted
                ? '保存を再試行'
                : '学習記録を保存'}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
      {loginHref && (
        <p className="mt-3 text-sm">
          <a
            href={loginHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline"
          >
            別タブで再ログイン
          </a>
          後、この画面で保存を再試行してください。同じアカウントでログインしてください。
        </p>
      )}
    </section>
  );
}
