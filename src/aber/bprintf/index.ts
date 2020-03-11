import State from "../state";
import {sendMessage} from "./bprintf";
import {Player} from "../support";
import {getName} from "../tk/reducer";

// Wrappers

// export const showFile = (text: string): string => `[f]${text}[/f]`;
// export const sendSound = (text: string): string => `[d]${text}[/d]`;
// export const sendVisiblePlayer = (player: string, text: string): string => `[s name="${player}"]${text}[/s]`;
// export const sendName = (text: string): string => `[p]${text}[/p]`;
// export const sendVisibleName = (text: string): string => `[c]${text}[/c]`;
// export const sendSoundPlayer = (text: string): string => `[P]${text}[/P]`;
// export const sendPlayerForVisible = (text: string): string => `[D]${text}[/D]`;
// export const sendKeyboard = (text: string): string => `[l]${text}[/l]`;

const BASE = '{{message}}';
const TEXT = '[f]{{message}}[/f]';
const AUDIBLE = '[P]{{author}}[/P][d]{{message}}[/d]';
const VISIBLE = '[D]{{author}}[/D][c]{{message}}[/c]';
const VISIBLE_PLAYER = '[s name="{{author}}"]{{message}}[/s]';
const KEYBOARD = '[l]{{message}}[/l]';

export const createBaseMessage = (message: string): string => JSON.stringify({
    messageType: BASE,
    message,
});
const createTextMessage = (message: string): string => JSON.stringify({
    messageType: TEXT,
    message,
});
export const createAudibleMessage = (message: string, author?: string): string => JSON.stringify({
    messageType: AUDIBLE,
    author,
    message,
});
export const createVisibleMessage = (message: string, author?: string): string => JSON.stringify({
    messageType: VISIBLE,
    author,
    message,
});
export const createVisiblePlayerMessage = (author: string, message: string): string => JSON.stringify({
    messageType: VISIBLE_PLAYER,
    author,
    message,
});
const createKeyboardMessage = (message: string): string => JSON.stringify({
    messageType: KEYBOARD,
    message,
});

export const sendBaseMessage = (state: State, text: string): Promise<void> => sendMessage(
    state,
    createBaseMessage(text),
);
export const sendTextMessage = (state: State, text: string): Promise<void> => sendMessage(
    state,
    createTextMessage(text),
);
export const sendAudibleMessage = (state: State, text: string, author?: string): Promise<void> => sendMessage(
    state,
    createAudibleMessage(text, author),
);
export const sendVisibleMessage = (state: State, text: string, author?: string): Promise<void> => sendMessage(
    state,
    createVisibleMessage(text, author),
);
export const sendKeyboardMessage = (state: State, text: string): Promise<void> => sendMessage(
    state,
    createKeyboardMessage(text),
);

export const playerName = (player: Player): string => `[p]${player.name}[/p]`;
export const actorName = (state: State): string => `[p]${getName(state)}[/p]`;