import type { ComponentProps, FC, MouseEvent } from 'react';
import classNames from 'classnames';

import styles from './button.module.scss';

type ButtonProps = ComponentProps<'button'> & {
  isLoading?: boolean;
};

const blockClick = (event: MouseEvent<HTMLButtonElement>) =>
  event.preventDefault();

const Button: FC<ButtonProps> = ({
  type = 'button',
  className,
  isLoading = false,
  onClick,
  children,
  ...rest
}) => (
  <button
    {...rest}
    type={type}
    className={classNames(styles.button, className, {
      [styles.button__loading]: isLoading,
    })}
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
