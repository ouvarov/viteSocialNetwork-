import type { FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { Textarea } from '@/components/common/Textarea';
import { useAuth } from '@/features/auth/useAuth.ts';
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
import { profilePage } from '@/routes/routePaths.ts';

import styles from './chat.module.scss';

const Chat: FC = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: chat, isPending } = useChat(chatId);
  const { messages, sendMessage } = useChatRoom(chatId, chat?.messages);
  const { mutate: deleteChat } = useDeleteChat();
  const { mutateAsync: renameChat } = useRenameChat();

  const renameForm = useForm<RenameChatFormValues>({
    resolver: zodResolver(renameChatSchema),
    defaultValues: { newChatName: '' },
  });

  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' },
  });

  const onRename = async ({
    newChatName,
  }: RenameChatFormValues): Promise<void> => {
    try {
      await renameChat({ chatId: String(chatId), newChatName });
      renameForm.reset();
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

  const handleOnRemove = () => {
    deleteChat(String(chatId), {
      onSuccess: () => void navigate(profilePage(String(user?.id))),
    });
  };

  if (isPending) return <Loader />;

  const renameErrors = renameForm.formState.errors;
  const messageErrors = messageForm.formState.errors;

  return (
    <div>
      {chat?.chatName && <h2 className={styles.title}>{chat.chatName}</h2>}
      <div>
        <Button onClick={handleOnRemove}>remove chat</Button>
      </div>
      <div>
        <form
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
            <p className={styles.error} role="alert">
              {renameErrors.root.server.message}
            </p>
          )}
          <Button isLoading={renameForm.formState.isSubmitting} type="submit">
            Rename Chat
          </Button>
        </form>
      </div>
      {messages.map((item) => (
        <Message {...item} key={item.messageId} />
      ))}

      <form
        noValidate
        onSubmit={(e) => void messageForm.handleSubmit(onSendMessage)(e)}
      >
        <Textarea
          {...messageForm.register('content')}
          id="message"
          label="Message"
          required
          error={messageErrors.content?.message}
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};

export { Chat };
