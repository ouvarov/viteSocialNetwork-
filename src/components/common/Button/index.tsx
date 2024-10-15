import React, { ButtonHTMLAttributes, FC } from 'react';
import classNames from 'classnames';

import styles from './button.module.scss';

type ButtonOptionalPropsType = {
  className?: string;
  isDisabled?: boolean;
  children?: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button: FC<ButtonOptionalPropsType> = ({
  className = '',
  children = null,
  isDisabled = false,
  ...props
}) => {
  const buttonClassnames = classNames(styles.button, className, {
    [styles.button__disable]: isDisabled,
  });

  return (
    <button {...props} disabled={isDisabled} className={buttonClassnames}>
      {children}
    </button>
  );
};

export { Button };
