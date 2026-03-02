'use client';

import type { ReactNode } from 'react';

const baseInput =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300/50';

export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 ${className}`}>
      {children}
    </div>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-6 border-b border-zinc-100 pb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function Label({
  children,
  htmlFor,
  className = '',
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-zinc-700 ${className}`}
    >
      {children}
    </label>
  );
}

export function Input({
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  min,
  max,
  readOnly,
  disabled,
  className = '',
  hasError,
  id,
  ...rest
}: {
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  id?: string;
  [key: string]: unknown;
}) {
  return (
    <input
      type={type}
      id={id}
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      readOnly={readOnly}
      disabled={disabled}
      className={`${baseInput} ${hasError ? 'border-red-500 focus:ring-red-200' : ''} ${className}`}
      {...rest}
    />
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  className = '',
  hasError,
  ...rest
}: {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  [key: string]: unknown;
}) {
  return (
    <textarea
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`${baseInput} resize-y ${hasError ? 'border-red-500 focus:ring-red-200' : ''} ${className}`}
      {...rest}
    />
  );
}

export function Select({
  value,
  onChange,
  children,
  disabled,
  className = '',
  hasError,
  ...rest
}: {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  [key: string]: unknown;
}) {
  const chevronSvg =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22none%22%3E%3Cpath d=%22M6 8l4 4 4-4%22 stroke=%22%2371717a%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E';

  return (
    <select
      value={value ?? ''}
      onChange={onChange}
      disabled={disabled}
      className={`h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-900 shadow-sm outline-none transition appearance-none hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed ${
        hasError ? 'border-red-500 focus:ring-red-200' : ''
      } ${className}`}
      style={{
        backgroundImage: `url("${chevronSvg}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px 16px',
        ...(rest as any).style,
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Button({
  type = 'button',
  variant = 'primary',
  children,
  disabled,
  className = '',
  ...rest
}: {
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  [key: string]: unknown;
}) {
  const variants = {
    primary:
      'bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-400 disabled:bg-zinc-400',
    secondary:
      'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-300 disabled:opacity-50',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 disabled:bg-red-400/70',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'danger';
  className?: string;
}) {
  const variants = {
    default: 'bg-zinc-200 text-zinc-800',
    success: 'bg-emerald-100 text-emerald-800',
    danger: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-0 border-t border-zinc-200 ${className}`} />;
}

export function Notice({
  children,
  variant = 'info',
  className = '',
}: {
  children: ReactNode;
  variant?: 'info' | 'success' | 'error';
  className?: string;
}) {
  const variants = {
    info: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  };
  return (
    <div
      className={`rounded-2xl border p-4 ${variants[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}
