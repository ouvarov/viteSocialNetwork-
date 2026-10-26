import type { FC } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { Textarea } from '@/components/common/Textarea';
import { Message } from '@/features/chat/components/Message';
import {
  useChat,
  useDeleteChat,
  useRenameChat,
} from '@/features/chat/queries.ts';
import { messageSchema, renameChatSchema } from '@/features/chat/schemas.ts';
import type {
  MessageFormValues,
  RenameChatFormValues,
} from '@/features/chat/schemas.ts';
import { useChatRoom } from '@/features/chat/useChatRoom.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';
import { chatsPage } from '@/routes/routePaths.ts';

import styles from './chat.module.scss';

const UNNAMED_CHAT = 'Untitled chat';

const Chat: FC = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const renameFormId = useId();
  const [isRenaming, setIsRenaming] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const { data: chat, isPending, isError, error, refetch } = useChat(chatId);
  const { messages, sendMessage } = useChatRoom(chatId, chat?.messages);
  const {
    mutate: deleteChat,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteChat();
  const { mutateAsync: renameChat } = useRenameChat();

  const title = chat?.chatName || UNNAMED_CHAT;
  useDocumentTitle(title);

  const renameForm = useForm<RenameChatFormValues>({
    resolver: zodResolver(renameChatSchema),
    defaultValues: { newChatName: '' },
  });

  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' },
  });

  const { setFocus } = renameForm;

  useEffect(() => {
    if (isRenaming) setFocus('newChatName');
  }, [isRenaming, setFocus]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages.length]);

  const onRename = async ({
    newChatName,
  }: RenameChatFormValues): Promise<void> => {
    try {
      await renameChat({ chatId: String(chatId), newChatName });
      renameForm.reset();
      setIsRenaming(false);
    } catch (renameError) {
      renameForm.setError('root.server', {
        message: getApiErrorMessage(renameError, 'Could not rename the chat'),
      });
    }
  };

  const onSendMessage = ({ content }: MessageFormValues): void => {
    sendMessage(content);
    messageForm.reset();
  };

  const handleDelete = () => {
    deleteChat(String(chatId), {
      onSuccess: () => void navigate(chatsPage()),
    });
  };

  if (isPending) return <Loader label="Loading chat" />;

  if (isError) {
    return (
      <ErrorState
        title="Could not open this chat"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  const renameErrors = renameForm.formState.errors;
  const messageErrors = messageForm.formState.errors;

  return (
    <section className={styles.chat}>
      <PageHeader title={title}>
        <Button
          variant="secondary"
          size="sm"
          aria-expanded={isRenaming}
          aria-controls={renameFormId}
          onClick={() => setIsRenaming((open) => !open)}
        >
          Rename
        </Button>
        <Button
          variant="danger"
          size="sm"
          isLoading={isDeleting}
          onClick={handleDelete}
        >
          Delete chat
        </Button>
      </PageHeader>

      {deleteError && (
        <p className={styles.chat__error} role="alert">
          {getApiErrorMessage(deleteError, 'Could not delete the chat')}
        </p>
      )}

      {isRenaming && (
        <form
          id={renameFormId}
          className={styles.chat__rename}
          noValidate
          onSubmit={(e) => void renameForm.handleSubmit(onRename)(e)}
        >
          <Input
            {...renameForm.register('newChatName')}
            id="nameChat"
            label="Chat name"
            required
            error={renameErrors.newChatName?.message}
          />
          {renameErrors.root?.server && (
            <p className={styles.chat__error} role="alert">
              {renameErrors.root.server.message}
            </p>
          )}
          <Button
            isLoading={renameForm.formState.isSubmitting}
            size="sm"
            type="submit"
          >
            Save name
          </Button>
        </form>
      )}

      <div
        ref={logRef}
        className={styles.chat__log}
        role="log"
        aria-label="Messages"
      >
        {messages.length === 0 ? (
          <EmptyState title="No messages yet">Say hi to start.</EmptyState>
        ) : (
          <ol className={styles.chat__messages}>
            {messages.map((item) => (
              <Message {...item} key={item.messageId} />
            ))}
          </ol>
        )}
      </div>

      <form
        className={styles.chat__composer}
        noValidate
        onSubmit={(e) => void messageForm.handleSubmit(onSendMessage)(e)}
      >
        <Textarea
          {...messageForm.register('content')}
          id="message"
          label="Message"
          required
          rows={2}
          className={styles.chat__field}
          error={messageErrors.content?.message}
        />
        <Button type="submit">Send</Button>
      </form>
    </section>
  );
};

export { Chat };
