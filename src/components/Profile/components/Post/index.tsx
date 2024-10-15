import React, { ChangeEvent, FC, useState } from 'react';
import Input from '@/components/common/Input';
import Textarea from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { createPost, getPost } from '@/components/Profile/api';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Loader } from '@/components/common/Loader';

const Post: FC = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => getPost({ id: user?.id || '' }),
  });
  const queryClient = useQueryClient();

  const { mutate: createNewPost } = useMutation(createPost, {
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  console.log(data);

  const [image, setImage] = useState<string>('');
  const [text, setText] = useState<string>('');

  const onChangeText = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
  };

  const onChangeImage = (e: ChangeEvent<HTMLInputElement>): void => {
    setImage(e.target.value);
  };

  const handleOneSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    createNewPost({ image, text, ownerId: user?.id });
  };

  return (
    <div>
      <div>
        <form onSubmit={handleOneSubmit}>
          <Input
            id="image"
            name={'image'}
            value={image}
            onChange={onChangeImage}
            placeholder={'enter image url'}
          />
          <Textarea
            id={'text'}
            name="text"
            value={text}
            onChange={onChangeText}
            placeholder={'enter post text'}
          />
          <Button type="submit">Submit</Button>
        </form>
      </div>
      <div>{isLoading && <Loader />}</div>
    </div>
  );
};

export { Post };
