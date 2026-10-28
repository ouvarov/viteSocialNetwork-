import type { FC, ReactNode, SyntheticEvent } from 'react';
import { useEffect, useId, useRef } from 'react';

import { Button } from '@/components/common/Button';

import styles from './confirm_dialog.module.scss';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  confirmLabel: string;
  children?: ReactNode;
  fields?: ReactNode;
  error?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  confirmLabel,
  children,
  fields,
  error,
  isConfirming = false,
  onConfirm,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const keepOpenWhileConfirming = (event: SyntheticEvent) => {
    if (isConfirming) event.preventDefault();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.confirm_dialog}
      aria-labelledby={titleId}
      aria-describedby={children ? textId : undefined}
      onCancel={keepOpenWhileConfirming}
      onClose={onClose}
    >
      <h2 id={titleId} className={styles.confirm_dialog__title}>
        {title}
      </h2>
      {children && (
        <p id={textId} className={styles.confirm_dialog__text}>
          {children}
        </p>
      )}
      {fields && <div className={styles.confirm_dialog__fields}>{fields}</div>}
      {error && (
        <p className={styles.confirm_dialog__error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.confirm_dialog__actions}>
        <Button
          variant="secondary"
          size="sm"
          aria-disabled={isConfirming}
          onClick={() => {
            if (!isConfirming) onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          isLoading={isConfirming}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
};

export { ConfirmDialog };
