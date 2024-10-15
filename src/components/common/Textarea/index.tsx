import { SyntheticEvent, ChangeEvent } from 'react';
import classNames from 'classnames';

import styles from './textarea.module.scss';

type TextareaPropsType = {
  id: string;
  name: string;
  value?: string;
  placeholder?: string;
  className?: string;
  onFocus?: (e: SyntheticEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: SyntheticEvent<HTMLTextAreaElement>) => void;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

const Textarea: React.FC<TextareaPropsType> = ({
  id,
  name,
  value = '',
  placeholder = '',
  className = '',
  onFocus,
  onBlur,
  onChange,
}) => (
  <div className={classNames(styles.textarea, className)}>
    <textarea
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={onChange}
      id={id}
      name={name}
      value={value}
      placeholder={placeholder}
      className={styles.textarea__control}
    />
  </div>
);

export default Textarea;
