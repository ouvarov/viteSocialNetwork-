import React from 'react';

import defaultIcon from './defaultIcon.svg';

type UserIconPropsType = {
  imageUrl?: string;
};

const UserIcon: React.FC<UserIconPropsType> = ({ imageUrl }) => (
  <div className="user-icon">
    <figure
      className="user-icon__item"
      style={{ backgroundImage: `url(${imageUrl || defaultIcon})` }}
    />
  </div>
);

export { UserIcon };
