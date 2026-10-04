'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  hint?: string;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name="password"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={15}
          maxLength={128}
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示する'}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-700"
        >
          {visible ? (
            <EyeOff aria-hidden="true" size={19} />
          ) : (
            <Eye aria-hidden="true" size={19} />
          )}
        </button>
      </div>
      {hint ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
