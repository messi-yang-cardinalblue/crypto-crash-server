import { v4 as uuidv4 } from 'uuid';
import { Player } from '../entity/player';
import { Token } from '../entity/token';

export type Transaction = {
  id: string;
  playerId: string;
  tokenId: string;
  timestamp: number;
  amount: number;
  price: number;
};

export function createTransaction(
  playerId: string,
  tokenId: string,
  price: number,
  amount: number
): Transaction {
  return {
    id: uuidv4(),
    playerId: playerId,
    tokenId: tokenId,
    timestamp: new Date().getTime(),
    price: price,
    amount: amount,
  };
}
