import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, required, options, error, helperText, className = '', id, children, ...rest }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all font-medium shadow-xs cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-100'
              : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
          } ${className}`}
          {...rest}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 font-medium">{helperText}</p>}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
