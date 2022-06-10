import { v4 as uuidv4 } from 'uuid';

export type Token = {
  id: string;
  name: string;
  price: number;
  historyPrices: number[];
  _energy: number; // internal parameter for tracking how much $ has been put into a token
};

export function createToken(name: string, price: number): Token {
  return {
    id: uuidv4(),
    name,
    price,
    historyPrices: [price],
    _energy: Math.random()*1000
  };
}
