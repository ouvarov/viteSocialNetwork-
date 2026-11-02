import type { FC, KeyboardEvent, SyntheticEvent } from 'react';
import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import { getApiErrorMessage, isNotFoundError } from '@/api/errors.ts';
import { HTTP_STATUS } from '@/api/http-status.ts';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { Textarea } from '@/components/common/Textarea';
import { useAuth } from '@/features/auth/useAuth.ts';
import { GroupInfoDialog } from '@/features/chat/components/GroupInfoDialog';
import { Message } from '@/features/chat/components/Message';
import { groupMessages } from '@/features/chat/message-groups.ts';
import { toChronological } from '@/features/chat/messages.ts';
import {
  useChat,
  useChatMessages,
  useDeleteChat,
  useMarkChatRead,
} from '@/features/chat/queries.ts';
import { messageSchema } from '@/features/chat/schemas.ts';
import type { MessageFormValues } from '@/features/chat/schemas.ts';
import type { MessagesDataTypes } from '@/features/chat/types.ts';
import { useChatListUpdates } from '@/features/chat/useChatListUpdates.ts';
import { ChatSocketError, useChatRoom } from '@/features/chat/useChatRoom.ts';
import { useGroupUpdates } from '@/features/chat/useGroupUpdates.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';
import { useDocumentVisible } from '@/hooks/useDocumentVisible.ts';
import { DELETED_USER_NAME } from '@/features/users/deleted-user.ts';
import { useOnVisible } from '@/hooks/useOnVisible.ts';
import { useScrollAnchor } from '@/hooks/useScrollAnchor.ts';
import { useSocketConnected } from '@/hooks/useSocketConnected.ts';
import { chatsPage } from '@/routes/routePaths.ts';

import styles from './chat.module.scss';

const CHAT_TITLE_WHILE_LOADING = 'Chat';
const NO_MESSAGES: MessagesDataTypes[] = [];

const lastIncomingId = (
  messages: MessagesDataTypes[],
  userId: string | undefined,
): string | undefined =>
  [...messages].reverse().find(({ senderId }) => senderId !== userId)
    ?.messageId;

const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

const isSendShortcut = (event: KeyboardEvent<HTMLTextAreaElement>) =>
  event.key === 'Enter' &&
  !event.shiftKey &&
  !event.nativeEvent.isComposing &&
  !isCoarsePointer();

const deleteForMeText = (peerName: string | undefined) =>
  peerName
    ? `The history disappears only for you. ${peerName} still sees it.`
    : 'The history disappears for you.';

const Chat: FC = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutate: markRead } = useMarkChatRead();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const closedNoteId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const isDocumentVisible = useDocumentVisible();

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
  useChatListUpdates();
  useGroupUpdates(chatId);
  const {
    mutate: deleteChat,
    reset: resetDelete,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteChat();

  const messages = history ? toChronological(history) : NO_MESSAGES;
  const newestIncomingId = lastIncomingId(messages, user?.id);
  const peerName = chat?.peer?.userName;

  useEffect(() => {
    if (chatId && newestIncomingId && isDocumentVisible) {
      markRead({ chatId, upToMessageId: newestIncomingId });
    }
  }, [chatId, newestIncomingId, isDocumentVisible, markRead]);

  const isGroup = chat?.kind === 'group';
  const title = !chat
    ? CHAT_TITLE_WHILE_LOADING
    : (chat.title ?? peerName ?? DELETED_USER_NAME);
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

  const submitMessage = (event: SyntheticEvent) => {
    event.preventDefault();
    if (isSendingRef.current) return;

    isSendingRef.current = true;
    void messageForm
      .handleSubmit(onSendMessage)()
      .finally(() => {
        isSendingRef.current = false;
      });
  };

  const sendOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isSendShortcut(event)) submitMessage(event);
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

  if (!chat || (isError && isNotFoundError(error))) {
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
        {isGroup ? (
          <Button
            variant="secondary"
            size="sm"
            aria-haspopup="dialog"
            onClick={() => setIsGroupInfoOpen(true)}
          >
            Group info
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            aria-haspopup="dialog"
            onClick={openDeleteDialog}
          >
            Delete for me
          </Button>
        )}
      </PageHeader>

      {isGroup && isGroupInfoOpen && (
        <GroupInfoDialog
          chat={chat}
          onClose={() => setIsGroupInfoOpen(false)}
        />
      )}

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
            {groupMessages(messages).map((grouped) => (
              <Fragment key={grouped.message.messageId}>
                {grouped.dayLabel && (
                  <li className={styles.chat__day} data-day>
                    {grouped.dayLabel}
                  </li>
                )}
                <Message {...grouped} isInGroupChat={isGroup} />
              </Fragment>
            ))}
          </ol>
        )}
      </div>

      <form
        className={styles.chat__composer}
        noValidate
        onSubmit={submitMessage}
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
            onKeyDown={sendOnEnter}
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
