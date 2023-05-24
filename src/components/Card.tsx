import type { ReactNode } from 'react';

interface ICard {
  className?: string;
  children: ReactNode;
}

export const Card = (props: ICard) => {
  const { className } = props;
  return (
    <div
      className={`rounded border-2 border-indigo-200 px-3 py-4 ${className}`}
    >
      {props.children}
    </div>
  );
};
