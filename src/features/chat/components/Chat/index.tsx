import type { FC } from 'react';
import { useId, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { HTTP_STATUS } from '@/api/http-status.ts';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { Textarea } from '@/components/common/Textarea';
import { Message } from '@/features/chat/components/Message';
import { toChronological } from '@/features/chat/messages.ts';
import {
  useChat,
  useChatMessages,
  useDeleteChat,
} from '@/features/chat/queries.ts';
import { messageSchema } from '@/features/chat/schemas.ts';
import type { MessageFormValues } from '@/features/chat/schemas.ts';
import type { MessagesDataTypes } from '@/features/chat/types.ts';
import { ChatSocketError, useChatRoom } from '@/features/chat/useChatRoom.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';
import { DELETED_USER_NAME } from '@/features/users/deleted-user.ts';
import { useOnVisible } from '@/hooks/useOnVisible.ts';
import { useScrollAnchor } from '@/hooks/useScrollAnchor.ts';
import { useSocketConnected } from '@/hooks/useSocketConnected.ts';
import { chatsPage } from '@/routes/routePaths.ts';

import styles from './chat.module.scss';

const CHAT_TITLE_WHILE_LOADING = 'Chat';
const NO_MESSAGES: MessagesDataTypes[] = [];

const deleteForMeText = (peerName: string | undefined) =>
  peerName
    ? `The history disappears only for you. ${peerName} still sees it.`
    : 'The history disappears for you.';

const Chat: FC = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const closedNoteId = useId();
  const logRef = useRef<HTMLDivElement>(null);

  const {
    data: chat,
    isPending,
    isError,
    error,
    refetch: refetchChat,
  } = useChat(chatId);
  const {
    data: history,
    isPending: isHistoryPending,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useChatMessages(chatId);
  const { sendMessage, isJoinFailed, retryJoin } = useChatRoom(chatId);
  const isConnected = useSocketConnected();
  const {
    mutate: deleteChat,
    reset: resetDelete,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteChat();

  const messages = history ? toChronological(history) : NO_MESSAGES;
  const peerName = chat?.peer?.userName;
  const title = chat
    ? (peerName ?? DELETED_USER_NAME)
    : CHAT_TITLE_WHILE_LOADING;
  useDocumentTitle(title);
  useScrollAnchor(
    logRef,
    messages[0]?.messageId,
    messages[messages.length - 1]?.messageId,
  );

  const loadOlder = () => void fetchNextPage();
  const loadOlderRef = useOnVisible<HTMLButtonElement>(
    loadOlder,
    hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
  );

  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' },
  });

  const onSendMessage = async ({
    content,
  }: MessageFormValues): Promise<void> => {
    try {
      await sendMessage(content);
      messageForm.reset();
    } catch (sendError) {
      if (
        sendError instanceof ChatSocketError &&
        sendError.statusCode === HTTP_STATUS.GONE
      ) {
        void refetchChat();
      }
      messageForm.setError('root.server', {
        message:
          sendError instanceof ChatSocketError
            ? sendError.message
            : 'Message not sent. Check your connection and try again.',
      });
    }
  };

  const openDeleteDialog = () => {
    resetDelete();
    setIsConfirmingDelete(true);
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
        onRetry={() => void refetchChat()}
      />
    );
  }

  const messageErrors = messageForm.formState.errors;

  return (
    <section className={styles.chat}>
      <PageHeader title={title}>
        <Button
          variant="danger"
          size="sm"
          aria-haspopup="dialog"
          onClick={openDeleteDialog}
        >
          Delete for me
        </Button>
      </PageHeader>

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title="Delete this chat for you?"
        confirmLabel="Delete for me"
        isConfirming={isDeleting}
        error={
          deleteError
            ? getApiErrorMessage(deleteError, 'Could not delete the chat')
            : undefined
        }
        onConfirm={handleDelete}
        onClose={() => setIsConfirmingDelete(false)}
      >
        {deleteForMeText(peerName)}
      </ConfirmDialog>

      <p className={styles.chat__status} role="status">
        {isConnected ? '' : 'Connecting to the chat…'}
      </p>
      {isJoinFailed && (
        <p className={styles.chat__join_error} role="alert">
          New messages are not arriving.{' '}
          <Button variant="secondary" size="sm" onClick={retryJoin}>
            Try again
          </Button>
        </p>
      )}

      <div
        ref={logRef}
        className={styles.chat__log}
        role="log"
        aria-label="Messages"
        aria-busy={isHistoryPending || isFetchingNextPage || undefined}
      >
        {hasNextPage && (
          <Button
            ref={loadOlderRef}
            variant="secondary"
            size="sm"
            className={styles.chat__older}
            isLoading={isFetchingNextPage}
            onClick={loadOlder}
          >
            {isFetchNextPageError ? 'Try again' : 'Show earlier messages'}
          </Button>
        )}
        {isHistoryPending && <Loader label="Loading messages" />}
        {isHistoryError && !history && (
          <ErrorState
            title="Could not load messages"
            error={historyError}
            onRetry={() => void refetchHistory()}
          />
        )}
        {history && messages.length === 0 && (
          <EmptyState title="No messages yet">Say hi to start.</EmptyState>
        )}
        {messages.length > 0 && (
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
        <fieldset className={styles.chat__fields} disabled={!chat.canSend}>
          <Textarea
            {...messageForm.register('content')}
            id="message"
            label="Message"
            required
            rows={2}
            className={styles.chat__field}
            aria-describedby={chat.canSend ? undefined : closedNoteId}
            error={messageErrors.content?.message}
          />
          <Button isLoading={messageForm.formState.isSubmitting} type="submit">
            Send
          </Button>
        </fieldset>
        {!chat.canSend && (
          <p id={closedNoteId} className={styles.chat__closed}>
            This account was deleted
          </p>
        )}
        {messageErrors.root?.server && (
          <p className={styles.chat__send_error} role="alert">
            {messageErrors.root.server.message}
          </p>
        )}
      </form>
    </section>
  );
};

export { Chat };
