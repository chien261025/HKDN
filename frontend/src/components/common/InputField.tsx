import React from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  error?: string;
  helperText?: string;
  action?: React.ReactNode;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      required,
      icon,
      iconRight,
      error,
      helperText,
      action,
      className = '',
      id,
      disabled,
      ...rest
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="space-y-1.5 w-full">
        {(label || action) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                {label} {required && <span className="text-rose-500">*</span>}
              </label>
            )}
            {action && <div className="text-xs">{action}</div>}
          </div>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all font-medium shadow-xs disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
              icon ? 'pl-10' : ''
            } ${iconRight ? 'pr-10' : ''} ${
              error
                ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-100'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
            } ${className}`}
            {...rest}
          />

          {iconRight && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {iconRight}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 font-medium">{helperText}</p>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';
