import type { FC } from 'react';
import { useState } from 'react';
import { Link } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/features/auth/useAuth.ts';
import { FollowButton } from '@/features/follows/components/FollowButton';
import { followersLabel } from '@/features/follows/followers-label.ts';
import type { PersonTypes } from '@/features/follows/types.ts';
import { useUsers } from '@/features/users/queries.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';
import { useOnVisible } from '@/hooks/useOnVisible.ts';
import { profilePage } from '@/routes/routePaths.ts';

import styles from './users.module.scss';

const matchesQuery = (person: PersonTypes, query: string): boolean =>
  person.userName
    .toLocaleLowerCase()
    .includes(query.trim().toLocaleLowerCase());

type PersonRowProps = {
  person: PersonTypes;
  isMe: boolean;
};

const PersonRow: FC<PersonRowProps> = ({ person, isMe }) => (
  <li className={styles.person}>
    <Avatar
      userId={person.id}
      userName={person.userName}
      imageUrl={person.imageUrl}
      size="lg"
    />
    <div className={styles.person__body}>
      <Link className={styles.person__name} to={profilePage(person.id)}>
        {person.userName}
      </Link>
      {person.description && (
        <p className={styles.person__bio}>{person.description}</p>
      )}
      <p className={styles.person__stats}>
        {person.followersCount} {followersLabel(person.followersCount)}
      </p>
    </div>
    {isMe ? (
      <span className={styles.person__badge}>You</span>
    ) : (
      <FollowButton
        userId={person.id}
        userName={person.userName}
        isFollowedByMe={person.isFollowedByMe}
      />
    )}
  </li>
);

const UsersList: FC<{ query: string }> = ({ query }) => {
  const { user } = useAuth();
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useUsers();

  const loadMore = () => void fetchNextPage();
  const loadMoreRef = useOnVisible<HTMLButtonElement>(
    loadMore,
    hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
  );

  if (isPending) return <Loader label="Loading people" />;

  if (isError && !data) {
    return (
      <ErrorState
        title="Could not load people"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  const people = data.pages
    .flatMap((page) => page.items)
    .filter((person) => matchesQuery(person, query));

  const emptyState = query.trim() ? (
    <EmptyState title={`No one matches "${query.trim()}"`}>
      Check the spelling or try a shorter name.
    </EmptyState>
  ) : (
    <EmptyState title="No users yet">Invite a friend to Pulse.</EmptyState>
  );

  return (
    <>
      {people.length === 0 ? (
        emptyState
      ) : (
        <ul className={styles.list}>
          {people.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              isMe={person.id === user?.id}
            />
          ))}
        </ul>
      )}
      {isFetchNextPageError && (
        <p className={styles.error} role="alert">
          {getApiErrorMessage(error, 'Could not load more people')}
        </p>
      )}
      {hasNextPage && (
        <Button
          ref={loadMoreRef}
          variant="secondary"
          className={styles.more}
          isLoading={isFetchingNextPage}
          onClick={loadMore}
        >
          {isFetchNextPageError ? 'Try again' : 'Show more people'}
        </Button>
      )}
    </>
  );
};

const Users: FC = () => {
  const [query, setQuery] = useState('');
  useDocumentTitle('People');

  return (
    <section>
      <PageHeader title="People" />
      <p className={styles.subtitle}>
        Follow people to see their posts first in your Home feed.
      </p>
      <Input
        className={styles.search}
        type="search"
        label="Search people"
        placeholder="Search people"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <UsersList query={query} />
    </section>
  );
};

export { Users };
