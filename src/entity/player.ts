import { v4 as uuidv4 } from 'uuid';

export type Player = {
  id: string;
  name: string;
  cash: number;
  tokenOwnerships: {
    [tokenId: string]: {
      amount: number;
    };
  };
};

export function createPlayer(name: string, cash: number): Player {
  return {
    id: uuidv4(),
    name,
    cash,
    tokenOwnerships: {},
  };
}
