import { Socket } from 'socket.io';
import { Token, createToken } from '../../entity/token';
import { Player } from '../../entity/player';
import { generateHexColor } from '../../utils/common';
import { CryptoCrash } from '../../lib/cryptoCrash';

const token1: Token = createToken('Catcoin', 100);
const token2: Token = createToken('Dogcoin', 100);
const token3: Token = createToken('Birdcoin', 100);
const cryptoCrash = new CryptoCrash([token1, token2, token3]);

const messiPlayer: Player = cryptoCrash.addPlayer('Messi', 10000);
const johnPlayer: Player = cryptoCrash.addPlayer('John', 10000);
const lichinPlayer: Player = cryptoCrash.addPlayer('Lichin', 10000);
const christinePlayer: Player = cryptoCrash.addPlayer('Christine', 10000);

cryptoCrash.addTransaction(messiPlayer.id, token1.id, 10);
cryptoCrash.addTransaction(messiPlayer.id, token1.id, 100);
cryptoCrash.addTransaction(messiPlayer.id, token1.id, -100);
cryptoCrash.addTransaction(messiPlayer.id, token1.id, -100);
cryptoCrash.addTransaction(lichinPlayer.id, token1.id, 100);
cryptoCrash.addTransaction(christinePlayer.id, token1.id, 100);

const subscribers: {
  [playerId: string]: any;
} = {};
setInterval(() => {
  const output = cryptoCrash.output();
  Object.keys(subscribers).forEach((playerId) => {
    subscribers[playerId](output);
  });
}, 1000);

enum SocketEventName {
  LoggedIn = 'LOGGED_IN',
  GameUpdated = 'GAME_UPDATED',
  PlayerJoined = 'PLAYER_JOINED',
  PlayerLeft = 'PLAYER_LEFT',
}

export const gameAuthenticator = (socket: Socket, next: any) => {
  const newPlayer = cryptoCrash.addPlayer(generateHexColor(), 10000);
  socket.data.player = newPlayer;
  next();
};

const subscribeGameUpdateEvent = (nop: Socket, player: Player) => {
  subscribers[player.id] = (progress: any) => {
    nop.emit(SocketEventName.GameUpdated, progress);
  };
};

const emitLoggedInEvent = (nop: Socket, player: Player) => {
  nop.emit(SocketEventName.LoggedIn, player);
};

const brodcastPlayerJoinedEvent = (nop: Socket, player: Player) => {
  nop.broadcast.emit(SocketEventName.PlayerJoined, player);
};

const brodcastPlayerLeftEvent = (nop: Socket, player: Player) => {
  nop.broadcast.emit(SocketEventName.PlayerLeft, player);
};

const handlePlayerLeftEvent = (nop: Socket, player: Player) => {
  nop.on('disconnect', () => {
    cryptoCrash.removePlayer(player.id);
    brodcastPlayerLeftEvent(nop, player);
  });
};

export const gameHandler = (nop: Socket) => {
  // Get the user data
  const player: Player = nop.data.player;
  console.log(`Player with oid of ${player.id} connected.`);

  emitLoggedInEvent(nop, player);

  subscribeGameUpdateEvent(nop, player);

  brodcastPlayerJoinedEvent(nop, player);

  handlePlayerLeftEvent(nop, player);
};

export {};
