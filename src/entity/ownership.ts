import { v4 as uuidv4 } from 'uuid';

export type Ownership = {
  id: string;
  playerId: string;
  tokenId: string;
  amount: number;
};

export function createOwnership(
  playerId: string,
  tokenId: string,
  amount: number
): Ownership {
  return {
    id: uuidv4(),
    playerId: playerId,
    tokenId: tokenId,
    amount,
  };
}
