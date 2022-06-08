import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { Player } from '../../entity/player';

const secretKey = process.env.SECRET_KEY || 'hello_world';
console.log(secretKey, '11111');

export const validateToken = (token: string): Player => {
  return jwt.verify(token, secretKey) as Player;
};

export const generateToken = (player: Player) => {
  return jwt.sign(player, secretKey);
};
