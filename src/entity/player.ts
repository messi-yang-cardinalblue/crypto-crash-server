import { v4 as uuidv4 } from 'uuid';
import { Transaction } from './transaction';

export type Player = {
  id: string;
  name: string;
  cash: number;
  tokenOwnerships: {
    [tokenId: string]: {
      amount: number;
    };
  };
  transactions: Transaction[];
};

export function createPlayer(name: string, cash: number): Player {
  return {
    id: uuidv4(),
    name,
    cash,
    tokenOwnerships: {},
    transactions: [],
  };
}
