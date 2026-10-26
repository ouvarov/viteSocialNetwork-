import type { ComponentProps, FC } from 'react';
import { useId } from 'react';
import classNames from 'classnames';

import styles from './textarea.module.scss';

type TextareaProps = ComponentProps<'textarea'> & {
  label: string;
  error?: string;
};

const Textarea: FC<TextareaProps> = ({
  id,
  label,
  error,
  className,
  'aria-describedby': describedBy,
  ...rest
}) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className={classNames(styles.textarea, className)}>
      <label htmlFor={textareaId} className={styles.textarea__label}>
        {label}
      </label>
      <textarea
        {...rest}
        id={textareaId}
        className={styles.textarea__control}
        aria-invalid={error ? true : rest['aria-invalid']}
        aria-describedby={
          classNames(describedBy, { [errorId]: error }) || undefined
        }
      />
      {error && (
        <p id={errorId} className={styles.textarea__error}>
          {error}
        </p>
      )}
    </div>
  );
};

export { Textarea };
export type { TextareaProps };
