type Props = { loading: boolean; error: string | null; reload: () => void };
export function ResourceNotice({ loading, error, reload }: Props) {
  if (loading)
    return (
      <p role="status" className="py-4 text-sm text-gray-500">
        読み込み中...
      </p>
    );
  if (!error) return null;
  return (
    <div
      role="alert"
      className="my-4 rounded-lg border border-red-200 p-4 text-red-600"
    >
      <p>{error}</p>
      <button
        type="button"
        onClick={reload}
        className="mt-3 rounded border px-4 py-2"
      >
        再試行
      </button>
    </div>
  );
}
