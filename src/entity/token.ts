import { v4 as uuidv4 } from 'uuid';

export type Token = {
  id: string;
  name: string;
  price: number;
};

export function createToken(name: string, price: number): Token {
  return {
    id: uuidv4(),
    name,
    price,
  };
}
