import { useId, useState } from 'react';

// Labelled input with optional error text and a show/hide toggle for passwords
export default function Field({ label, type = 'text', error, hint, ...props }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="input-toggle"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {(error || hint) && (
        <small id={`${id}-msg`} className={error ? 'field-error' : 'muted'}>
          {error || hint}
        </small>
      )}
    </div>
  );
}
