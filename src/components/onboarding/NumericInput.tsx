import React from 'react';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  unit?: string;
  allowDecimal?: boolean;
  error?: string;
  onChange: (value: string) => void;
  value: string | number;
  hint?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  label,
  unit,
  allowDecimal = false,
  error,
  onChange,
  value,
  hint,
  id,
  placeholder,
  disabled = false,
  ...props
}) => {
  // Manejo de eventos onKeyDown para bloquear físicamente cualquier caracter alfabético o no numérico
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Teclas de control permitidas (navegación, borrado, copiado, pegado)
    const allowedControls = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedControls.includes(e.key) || (e.ctrlKey || e.metaKey)) {
      return;
    }

    // Si permite decimales, permitir un solo punto
    if (allowDecimal && (e.key === '.' || e.key === ',')) {
      const currentVal = String(value ?? '');
      if (currentVal.includes('.') || currentVal.includes(',')) {
        e.preventDefault();
      }
      return;
    }

    // Bloquear explícitamente caracteres de exponentes y signos comúnmente permitidos por type="number"
    if (['e', 'E', '+', '-', ' '].includes(e.key)) {
      e.preventDefault();
      return;
    }

    // Solo permitir dígitos 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Sanitización de seguridad adicional en onChange (por si se pega texto con el mouse)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(',', '.');

    if (allowDecimal) {
      // Remover todo lo que no sea dígito o punto
      raw = raw.replace(/[^0-9.]/g, '');
      // Asegurar un solo punto decimal
      const parts = raw.split('.');
      if (parts.length > 2) {
        raw = parts[0] + '.' + parts.slice(1).join('');
      }
      // Limitar a máximo 1 decimal para pesos (ej. 74.5)
      if (parts.length === 2 && parts[1].length > 1) {
        raw = parts[0] + '.' + parts[1].slice(0, 1);
      }
    } else {
      // Solo dígitos enteros
      raw = raw.replace(/[^0-9]/g, '');
    }

    onChange(raw);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {hint && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {hint}
          </span>
        )}
      </div>

      <div className="relative rounded-xl shadow-sm">
        <input
          {...props}
          id={id}
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          pattern={allowDecimal ? '[0-9]*[.]?[0-9]?' : '[0-9]*'}
          value={value ?? ''}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`block w-full rounded-xl border py-2.5 px-3.5 pr-12 text-slate-900 dark:text-white bg-white dark:bg-slate-900 text-base transition-all duration-200 focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800' : ''}`}
        />

        {unit && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {unit}
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
