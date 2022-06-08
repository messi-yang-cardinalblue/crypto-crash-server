import { v4 as uuidv4 } from 'uuid';
import { Player, createPlayer } from '../entity/player';
import { Token, createToken } from '../entity/token';
import { Ownership, createOwnership } from '../entity/ownership';
import { Transaction, createTransaction } from '../entity/transaction';

export class CryptoCrash {
  private id: string;
  private players: Player[];
  private tokens: Token[];
  private ownerships: Ownership[];
  private transactions: Transaction[];

  constructor(tokens: Token[]) {
    this.id = uuidv4();
    this.players = [];
    this.tokens = tokens;
    this.ownerships = [];
    this.transactions = [];
  }
  public output() {
    return {
      id: this.id,
      players: this.players,
      tokens: this.tokens,
      ownerships: this.ownerships,
      transactions: this.transactions,
    };
  }
  public addToken(name: string, price: number): Token {
    const newToken = createToken(name, price);
    this.tokens.push(newToken);
    return newToken;
  }
  public addPlayer(name: string, cash: number): Player {
    const newPlayer = createPlayer(name, cash);
    this.players.push(newPlayer);
    return newPlayer;
  }
  public updateTokenPrice(tokenId: string, price: number) {
    const token = this.getToken(tokenId);
    if (!token) {
      return;
    }

    token.price = price;
  }
  public removePlayer(playerId: string) {
    this.players = this.players.filter((p) => p.id != playerId);
  }
  public addTransaction(playerId: string, tokenId: string, amount: number) {
    const token = this.getToken(tokenId);
    if (!token) {
      return;
    }
    const player = this.getPlayer(playerId);
    if (!player) {
      return;
    }
    let ownership = this.getOwnership(playerId, tokenId);
    if (!ownership) {
      ownership = this.addOwnership(playerId, tokenId, 0);
    }

    const tokenPrice = token.price;
    const zeroAmount = amount === 0;
    const noEnoughCash = player.cash < token.price * amount;
    const noEnoughToken = amount < 0 && ownership.amount < Math.abs(amount);
    if (zeroAmount) {
      return;
    }
    if (noEnoughCash) {
      return;
    }
    if (noEnoughToken) {
      return;
    }

    const transaction = createTransaction(
      playerId,
      tokenId,
      tokenPrice,
      amount
    );
    this.transactions.push(transaction);
    ownership.amount += amount;
  }
  private getPlayer(playerId: string): Player | null {
    return this.players.find((p) => p.id === playerId) || null;
  }
  private getToken(tokenId: string): Token | null {
    return this.tokens.find((t) => t.id === tokenId) || null;
  }
  private getOwnership(playerId: string, tokenId: string): Ownership | null {
    return (
      this.ownerships.find(
        (o) => o.playerId === playerId && tokenId === tokenId
      ) || null
    );
  }
  private addOwnership(
    playerId: string,
    tokenId: string,
    amount: number
  ): Ownership {
    const newOwnership = createOwnership(playerId, tokenId, amount);
    this.ownerships.push(newOwnership);
    return newOwnership;
  }
}
