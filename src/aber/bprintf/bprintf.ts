import State from '../state';
import {logger} from '../files';
import {Player} from '../support';
import {
    clearMessages,
    addMessage,
    getSnooped,
    stopSnoop,
    startSnoop,
} from './reducer';
import {openSnoop} from "./snoop";

const loseme = (state: State): void => undefined;
const crapup = (state: State, message: string): void => undefined;
const isdark = (state: State, locationId: number): boolean => false;

export const resetMessages = (state: State): void => {
    try {
        clearMessages(state); /* 4K of chars should be enough for worst case */
    } catch (e) {
        crapup(state, 'Out Of Memory')
    }
};

const bprintf = (state: State, message: string): Promise<void> => {
    /* Max 240 chars/msg */
    if (message.length > 235) {
        return logger.write('Bprintf Short Buffer overflow')
            .then(() => crapup(state, 'Internal Error in BPRINTF'));
    }

    /* Now we have a string of chars expanded */
    if ((message.length + state.sysbuf.length) > 4095) {
        loseme(state);
        return logger.write(`Buffer overflow on user ${state.globme}`)
            .then(() => crapup(state, 'PANIC - Buffer overflow'))
    }
    addMessage(state, message);

    return Promise.resolve();
};

export const setName = (state: State, player: Player): void => {
    const itBots = [
        'riatha',
        'shazareth',
    ];
    if (!player) {
        return;
    }
    if (player.playerId === state.mynum) {
        return;
    }
    /* Assign Him her etc according to who it is */
    if (player.isBot && itBots.every(bot => (player.name !== bot))) {
        state.wd_it = player.name;
        return;
    }
    if (player.sex) {
        state.wd_her = player.name;
    } else {
        state.wd_him = player.name;
    }
    state.wd_them = player.name;
};

export const canSeePlayer = (state: State, player: Player): boolean => {
    if (!player) {
        return true;
    }
    if (player.playerId === state.mynum) {
        /* me */
        return true;
    }
    if (player.visibility > state.my_lev) {
        return false;
    }
    if (state.ail_blind) {
        /* Cant see */
        return false;
    }
    if (player.locationId !== state.curch) {
        return true;
    }
    return !isdark(state, state.curch);
};

// Wrappers

export const showFile = (text: string): string => `[f]${text}[/f]`;
export const sendSound = (text: string): string => `[d]${text}[/d]`;
export const sendVisiblePlayer = (player: string, text: string): string => `[s name="${player}"]${text}[/s]`;
export const sendName = (text: string): string => `[p]${text}[/p]`;
export const sendVisibleName = (text: string): string => `[c]${text}[/c]`;
export const sendSoundPlayer = (text: string): string => `[P]${text}[/P]`;
export const sendPlayerForVisible = (text: string): string => `[D]${text}[/D]`;
export const sendKeyboard = (text: string): string => `[l]${text}[/l]`;

//

const chksnp = (state: State) => getSnooped(state)
    .then(snooped => snooped && sendsys(state, snooped.name, state.globme, -400, 0, null));
