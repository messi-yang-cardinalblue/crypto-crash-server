import { v4 as uuidv4 } from 'uuid';
import { Player, createPlayer } from '../entity/player';
import { Token, createToken } from '../entity/token';
import { Transaction, createTransaction } from '../entity/transaction';

export class CryptoCrash {
  private id: string;
  private players: Player[];
  private tokens: Token[];
  private transactions: Transaction[];

  constructor(tokens: Token[]) {
    this.id = uuidv4();
    this.players = [];
    this.tokens = tokens;
    this.transactions = [];
  }
  public output() {
    return {
      id: this.id,
      players: this.players,
      tokens: this.tokens.map((token) => {
        return {
          ...token,
          historyPrices: this.getLastItemsFromArray(token.historyPrices, 30),
        };
      }),
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
    const tokens = this.getTokens();
    tokens.forEach((t) => {
      newPlayer.tokenOwnerships[t.id] = { amount: 0 };
    });
    this.players.push(newPlayer);
    return newPlayer;
  }
  public getTokens(): Token[] {
    return this.tokens;
  }
  public updateTokenPrice(tokenId: string, price: number) {
    const token = this.getToken(tokenId);
    if (!token) {
      return;
    }

    token.price = price;
    token.historyPrices.push(price);
  }
  public removePlayer(playerId: string) {
    this.players = this.players.filter((p) => p.id != playerId);
  }
  public addTransaction(
    playerId: string,
    tokenId: string,
    amount: number
  ): Transaction | null {
    const token = this.getToken(tokenId);
    if (!token) {
      return null;
    }
    const player = this.getPlayer(playerId);
    if (!player) {
      return null;
    }
    const tokenOwnership = player.tokenOwnerships[tokenId];

    const tokenPrice = token.price;
    const totalPrice = token.price * amount;
    const zeroAmount = amount === 0;
    const noEnoughCash = player.cash < totalPrice;
    const noEnoughToken =
      amount < 0 && tokenOwnership.amount < Math.abs(amount);
    if (zeroAmount) {
      return null;
    }
    if (noEnoughCash) {
      return null;
    }
    if (noEnoughToken) {
      return null;
    }

    const transaction = createTransaction(
      playerId,
      tokenId,
      tokenPrice,
      amount
    );
    this.transactions.push(transaction);
    player.cash -= totalPrice;
    tokenOwnership.amount += amount;
    tokenOwnership.amount = Math.round(tokenOwnership.amount * 100) / 100;

    return transaction;
  }
  private getPlayer(playerId: string): Player | null {
    return this.players.find((p) => p.id === playerId) || null;
  }
  private getToken(tokenId: string): Token | null {
    return this.tokens.find((t) => t.id === tokenId) || null;
  }
  private getLastItemsFromArray<T>(items: T[], count: number) {
    return items.slice(
      items.length > count ? items.length - 10 : 0,
      items.length
    );
  }
}
