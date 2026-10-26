import type { ComponentProps, FC } from 'react';
import { useId } from 'react';
import classNames from 'classnames';

import styles from './input.module.scss';

type InputProps = ComponentProps<'input'> & {
  label: string;
  error?: string;
};

const Input: FC<InputProps> = ({
  id,
  label,
  error,
  className,
  'aria-describedby': describedBy,
  ...rest
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={classNames(styles.input, className)}>
      <label htmlFor={inputId} className={styles.input__label}>
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        className={styles.input__control}
        aria-invalid={error ? true : rest['aria-invalid']}
        aria-describedby={
          classNames(describedBy, { [errorId]: error }) || undefined
        }
      />
      {error && (
        <p id={errorId} className={styles.input__error}>
          {error}
        </p>
      )}
    </div>
  );
};

export { Input };
export type { InputProps };
