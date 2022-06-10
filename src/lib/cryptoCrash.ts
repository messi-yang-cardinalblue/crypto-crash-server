import { v4 as uuidv4 } from 'uuid';
import { getLastItemsFromArray } from '../utils/common';
import { Player, createPlayer } from '../entity/player';
import { Token, createToken } from '../entity/token';
import { Transaction, createTransaction } from '../entity/transaction';

export class CryptoCrash {
  private id: string;
  private initialCash: number = 1000;
  private players: Player[];
  private tokens: Token[];

  constructor() {
    this.id = uuidv4();
    this.players = [];
    this.tokens = [
      createToken('Batcoin', 100),
      createToken('Ethereal', 10),
      createToken('Dogycoin', 1),
      createToken('Beyonce Coin', 10),
      createToken('PicCoin', 10),
      createToken('Lunacy', 5),
      createToken('Untether', 1),
    ];
  }
  public output() {
    return {
      id: this.id,
      players: this.players.map((player) => {
        return {
          ...player,
          transactions: getLastItemsFromArray(player.transactions, 5),
        };
      }),
      tokens: this.tokens.map((token) => {
        return {
          ...token,
          historyPrices: getLastItemsFromArray(token.historyPrices, 30),
        };
      }),
    };
  }
  public reset() {
    this.players.forEach((p) => {
      p.cash = this.initialCash;
      Object.keys(p.tokenOwnerships).forEach(
        (tokenId) => (p.tokenOwnerships[tokenId].amount = 0)
      );
      p.transactions = [];
    });
    this.tokens.forEach((t) => {
      t.price = t.historyPrices[0];
      t.historyPrices = [t.price];
    });
  }
  public addToken(name: string, price: number): Token {
    const newToken = createToken(name, price);
    this.tokens.push(newToken);
    return newToken;
  }
  public addPlayer(name: string): Player {
    const newPlayer = createPlayer(name, this.initialCash);
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
  }

  public updateTokenEnergy(tokenId: string, energy: number) {
    const token = this.getToken(tokenId);
    if (!token) {
      return;
    }

    token._energy = energy;
  }

  public saveHistoryTokenPrice(tokenId: string) {
    const token = this.getToken(tokenId);
    if (!token) {
      return;
    }

    token.historyPrices.push(token.price);
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
    player.transactions.push(transaction);
    player.cash -= totalPrice;
    tokenOwnership.amount += amount;
    tokenOwnership.amount = Math.round(tokenOwnership.amount * 1000) / 1000;

    // record the impact in the token's energy
    this.updateTokenEnergy(tokenId, token._energy + amount*token.price);
    return transaction;
  }
  private getPlayer(playerId: string): Player | null {
    return this.players.find((p) => p.id === playerId) || null;
  }
  public getToken(tokenId: string): Token | null {
    return this.tokens.find((t) => t.id === tokenId) || null;
  }
}
