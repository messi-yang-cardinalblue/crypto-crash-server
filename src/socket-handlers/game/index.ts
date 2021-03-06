import { Socket } from 'socket.io';
import { Token } from '../../entity/token';
import { Player } from '../../entity/player';
import { Transaction } from '../../entity/transaction';
import { CryptoCrash } from '../../lib/cryptoCrash';
import { getLastItemsFromArray } from '../../utils/common';

const cryptoCrash = new CryptoCrash();

const subscribers: {
  [playerId: string]: any;
} = {};
const updateAllTokenPrices = () => {
  const allTokens = cryptoCrash.getTokens();
  allTokens.forEach((token: Token) => {
    /* -10% ~ +10% */
    const approxRandn1 = Math.random()+Math.random()+Math.random()+Math.random() - (Math.random()+Math.random()+Math.random()+Math.random());
    const approxRandn2 = Math.random()+Math.random()+Math.random()+Math.random() - (Math.random()+Math.random()+Math.random()+Math.random());
    
    const buyOrSell = (token.price > 3000*Math.random()) ? -1 : Math.floor(Math.random()*3-1);
    const newEnergy = (token._energy + token.price*buyOrSell +30)*0.95;
    const mu = (newEnergy < 500) ? (-0.1*Math.random()) : (0.05*Math.random());
    const sigma = 0.05;
    const priceFactor =  Math.exp(mu + approxRandn1*sigma);
    const newPrice = Math.abs(token.price*priceFactor + sigma*approxRandn2);
    const newPriceWithPrecisionOfTwo = Math.round(newPrice * 100) / 100;

    cryptoCrash.updateTokenEnergy(token.id, newEnergy);

    cryptoCrash.updateTokenPrice(token.id, newPriceWithPrecisionOfTwo);

    cryptoCrash.saveHistoryTokenPrice(token.id);
  });

  /* Emit new information to client */
  Object.keys(subscribers).forEach((playerId) => {
    subscribers[playerId](cryptoCrash.output());
  });
};
let updateAllTokenPricesInterval: any;
const stopGame = () => {
  if (updateAllTokenPricesInterval) {
    clearInterval(updateAllTokenPricesInterval);
  }
};
const startGame = () => {
  updateAllTokenPricesInterval = setInterval(updateAllTokenPrices, 1000);
};
startGame();

enum SocketEventName {
  LoggedIn = 'LOGGED_IN',
  GameUpdated = 'GAME_UPDATED',
  PlayerUpdated = 'PLAYER_UPDATED',
  PlayerJoined = 'PLAYER_JOINED',
  PlayerLeft = 'PLAYER_LEFT',
  TokenExchanged = 'TOKEN_EXCHANGED',
  MessageAnnounced = 'MESSAGE_ANNOUNCED',
  TokenDataReturned = 'TOKEN_DATA_RETURNED',
  ExchangeToken = 'EXCHANGE_TOKEN',
  StopGame = 'STOP_GAME',
  StartGame = 'START_GAME',
  ResetGame = 'RESET_GAME',
  AnnounceMessage = 'ANNOUNCE_MESSAGE',
  RequestTokenData = 'REQUEST_TOKEN_DATA',
}

export const gameAuthenticator = (socket: Socket, next: any) => {
  const name: any = socket.handshake.query.name;
  if (!name) {
    return;
  }
  const newPlayer = cryptoCrash.addPlayer(name);
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
  nop.emit(SocketEventName.PlayerUpdated, {
    ...player,
    transactions: getLastItemsFromArray(player.transactions, 5),
  });
};

const emitTokenDataReturnedEvent = (nop: Socket, tokenId: string) => {
  const token = cryptoCrash.getToken(tokenId);
  if (!token) {
    return;
  }

  nop.emit(SocketEventName.TokenDataReturned, token);
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

const brodcastMessageAnnouncedEvent = (
  nop: Socket,
  type: number,
  msg: string
) => {
  nop.broadcast.emit(SocketEventName.MessageAnnounced, type, msg);
  nop.emit(SocketEventName.MessageAnnounced, type, msg);
};

const handleStopGameEvent = (nop: Socket) => {
  nop.on(SocketEventName.StopGame, () => {
    stopGame();
  });
};

const handleStartGameEvent = (nop: Socket) => {
  nop.on(SocketEventName.StartGame, () => {
    startGame();
  });
};

const handleResetGameEvent = (nop: Socket) => {
  nop.on(SocketEventName.ResetGame, () => {
    cryptoCrash.reset();

    Object.keys(subscribers).forEach((playerId) => {
      subscribers[playerId](cryptoCrash.output());
    });
  });
};

const handleRequestTokenDataEvent = (nop: Socket) => {
  nop.on(SocketEventName.RequestTokenData, (tokenId: string) => {
    emitTokenDataReturnedEvent(nop, tokenId);
  });
};

const handleAnnounceMessage = (nop: Socket) => {
  nop.on(SocketEventName.AnnounceMessage, (type: number, msg: string) => {
    brodcastMessageAnnouncedEvent(nop, type, msg);
  });
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

  handleAnnounceMessage(nop);

  handleStopGameEvent(nop);

  handleStartGameEvent(nop);

  handleResetGameEvent(nop);

  handleRequestTokenDataEvent(nop);

  handleDisconnect(nop);
};

export {};
