import React, { FC } from 'react';

import styles from './input.module.scss';

type InputPropsType = {
  id: string;
  name: string;
  value?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  className?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
};

const Input: FC<InputPropsType> = ({
  type = 'text',
  id,
  name,
  value = '',
  placeholder = '',
  className = '',
  label,
  onChange,
}) => (
  <div className={`${styles.input}, ${className}`}>
    <label htmlFor={id}>
      {label && <p className={styles.input__label}>{label}</p>}
      <input
        onChange={onChange}
        type={type}
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        className={styles.input__control}
      />
    </label>
  </div>
);

export default Input;
