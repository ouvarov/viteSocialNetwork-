import type { ComponentProps, FC, MouseEvent } from 'react';
import classNames from 'classnames';

import styles from './button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'md' | 'sm';

type ButtonProps = ComponentProps<'button'> & {
  isLoading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClassNames: Record<ButtonVariant, string | undefined> = {
  primary: undefined,
  secondary: styles['button--secondary'],
  danger: styles['button--danger'],
};

const blockClick = (event: MouseEvent<HTMLButtonElement>) =>
  event.preventDefault();

const Button: FC<ButtonProps> = ({
  type = 'button',
  className,
  isLoading = false,
  variant = 'primary',
  size = 'md',
  onClick,
  children,
  ...rest
}) => (
  <button
    {...rest}
    type={type}
    className={classNames(
      styles.button,
      variantClassNames[variant],
      className,
      {
        [styles['button--small']]: size === 'sm',
        [styles.button__loading]: isLoading,
      },
    )}
    aria-busy={isLoading || undefined}
    aria-disabled={isLoading || rest['aria-disabled']}
    onClick={isLoading ? blockClick : onClick}
  >
    <span className={styles.button__label}>{children}</span>
    {isLoading && <span className={styles.button__spinner} aria-hidden />}
  </button>
);

export { Button };
export type { ButtonProps };
