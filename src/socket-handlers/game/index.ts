import { Socket } from 'socket.io';
import { Token, createToken } from '../../entity/token';
import { Player } from '../../entity/player';
import { Transaction } from '../../entity/transaction';
import { CryptoCrash } from '../../lib/cryptoCrash';

const token1: Token = createToken('Catcoin', 100);
const token2: Token = createToken('Dogcoin', 100);
const token3: Token = createToken('Birdcoin', 100);
const cryptoCrash = new CryptoCrash([token1, token2, token3]);

// const messiPlayer: Player = cryptoCrash.addPlayer('Messi', 10000);
// const johnPlayer: Player = cryptoCrash.addPlayer('John', 10000);
// const lichinPlayer: Player = cryptoCrash.addPlayer('Lichin', 10000);
// const christinePlayer: Player = cryptoCrash.addPlayer('Christine', 10000);

// cryptoCrash.addTransaction(messiPlayer.id, token1.id, 10);
// cryptoCrash.addTransaction(messiPlayer.id, token1.id, 100);
// cryptoCrash.addTransaction(messiPlayer.id, token1.id, -100);
// cryptoCrash.addTransaction(messiPlayer.id, token1.id, -100);
// cryptoCrash.addTransaction(lichinPlayer.id, token1.id, 50);
// cryptoCrash.addTransaction(christinePlayer.id, token1.id, 90);

const subscribers: {
  [playerId: string]: any;
} = {};
const updateAllTokenPrices = () => {
  const allTokens = cryptoCrash.getTokens();
  allTokens.forEach((token: Token) => {
    /* -10% ~ +10% */
    const marginPercent = Math.round(Math.random() * 200 - 100) / 1000;
    const newPrice = token.price + marginPercent * token.price;
    const newPriceWithPrecisionOfTwo = Math.round(newPrice * 100) / 100;
    cryptoCrash.updateTokenPrice(token.id, newPriceWithPrecisionOfTwo);
  });

  /* Emit new information to client */
  Object.keys(subscribers).forEach((playerId) => {
    subscribers[playerId](cryptoCrash.output());
  });
};
setInterval(updateAllTokenPrices, 1000);

enum SocketEventName {
  LoggedIn = 'LOGGED_IN',
  GameUpdated = 'GAME_UPDATED',
  PlayerUpdated = 'PLAYER_UPDATED',
  PlayerJoined = 'PLAYER_JOINED',
  PlayerLeft = 'PLAYER_LEFT',
  TokenExchanged = 'TOKEN_EXCHANGED',
  ExchangeToken = 'EXCHANGE_TOKEN',
  JoinGame = 'JOIN_GAME',
}

export const gameAuthenticator = (socket: Socket, next: any) => {
  const name: any = socket.handshake.query.name;
  if (!name) {
    return;
  }
  const newPlayer = cryptoCrash.addPlayer(name, 10000);
  socket.data.player = newPlayer;
  next();
};

const subscribeTokenPricesUpdateEvent = (nop: Socket) => {
  const player: Player = nop.data.player;
  subscribers[player.id] = (progress: any) => {
    emitPlayerUpdatedEvent(nop);
    nop.emit(SocketEventName.GameUpdated, progress);
  };
};

const emitPlayerUpdatedEvent = (nop: Socket) => {
  const player: Player = nop.data.player;
  nop.emit(SocketEventName.PlayerUpdated, player);
};

const broadcastTokenExchangedEvent = (
  nop: Socket,
  transaction: Transaction
) => {
  nop.broadcast.emit(SocketEventName.TokenExchanged, transaction);
};

const brodcastPlayerJoinedEvent = (nop: Socket) => {
  const player: Player = nop.data.player;
  nop.broadcast.emit(SocketEventName.PlayerJoined, player);
};

const handleExchangeTokenEvent = (nop: Socket) => {
  nop.on(SocketEventName.ExchangeToken, (tokenId: string, amount: number) => {
    const player: Player = nop.data.player;
    const newTransaction = cryptoCrash.addTransaction(
      player.id,
      tokenId,
      amount
    );
    // If you want to interfere the token price after each transaction, do it here
    // const token = cryptoCrash.getToken(tokenId);
    // if (token) {
    //   const tokenPrice = token.price * 10;
    //   cryptoCrash.updateTokenPrice(tokenId, tokenPrice);
    // }

    if (newTransaction) {
      broadcastTokenExchangedEvent(nop, newTransaction);
      emitPlayerUpdatedEvent(nop);
    }
  });
};

const brodcastPlayerLeftEvent = (nop: Socket, player: Player) => {
  nop.broadcast.emit(SocketEventName.PlayerLeft, player);
};

const handleDisconnect = (nop: Socket) => {
  nop.on('disconnect', () => {
    const player: Player = nop.data.player;
    cryptoCrash.removePlayer(player.id);
    brodcastPlayerLeftEvent(nop, player);
  });
};

export const gameHandler = (nop: Socket) => {
  emitPlayerUpdatedEvent(nop);

  subscribeTokenPricesUpdateEvent(nop);

  brodcastPlayerJoinedEvent(nop);

  handleExchangeTokenEvent(nop);

  handleDisconnect(nop);
};

export {};
