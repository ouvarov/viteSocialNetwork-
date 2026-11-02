import type { FC } from 'react';

import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { useUsers } from '@/features/users/queries.ts';

import styles from './people_picker.module.scss';

type PeoplePickerProps = {
  excludedIds: string[];
  selectedIds: string[];
  onToggle: (userId: string) => void;
};

const PeoplePicker: FC<PeoplePickerProps> = ({
  excludedIds,
  selectedIds,
  onToggle,
}) => {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUsers();

  if (isPending) return <Loader label="Loading people" />;

  if (isError) {
    return (
      <ErrorState
        title="Could not load people"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  const people = data.pages
    .flatMap(({ items }) => items)
    .filter(({ id }) => !excludedIds.includes(id));

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.picker__legend}>People</legend>
      {people.length === 0 && (
        <p className={styles.picker__empty}>
          {hasNextPage ? 'Show more to find others' : 'Nobody else to add'}
        </p>
      )}
      <ul className={styles.picker__list}>
        {people.map(({ id, userName, imageUrl }) => (
          <li key={id}>
            <label className={styles.picker__person}>
              <input
                type="checkbox"
                checked={selectedIds.includes(id)}
                onChange={() => onToggle(id)}
              />
              <Avatar userId={id} userName={userName} imageUrl={imageUrl} />
              {userName}
            </label>
          </li>
        ))}
      </ul>
      {hasNextPage && (
        <Button
          variant="secondary"
          size="sm"
          isLoading={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
        >
          Show more
        </Button>
      )}
    </fieldset>
  );
};

export { PeoplePicker };
