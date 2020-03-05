import State from "../state";
import {Player} from "../support";
import {getName} from "../tk/reducer";

export const getDebugMode = (state: State): boolean => state.debug_mode;
export const getCurrentChar = (state: State): string => state.strbuf[state.stp];
export const getWordBuffer = (state: State): string => state.wordbuf;
export const getPronoun = (state: State, pronoun: string): string => {
    const pronouns = {
        me: getName(state),
        myself: getName(state),
        it: state.wd_it,
        him: state.wd_him,
        her: state.wd_her,
        them: state.wd_them,
        there: state.wd_there,
    };
    return pronouns[pronoun];
};

export const changeDebugMode = (state: State): void => {
    state.debug_mode = !state.debug_mode;
};
export const setStop = (state: State, value: number): void => {
    state.stp = value;
} ;
export const nextStop = (state: State): void => {
    state.stp = state.stp + 1;
} ;
export const resetStop = (state: State): void => {
    state.stp = 0;
} ;
export const setStringBuffer = (state: State, value: string): void => {
    state.strbuf = value;
} ;
export const resetWordBuffer = (state: State): void => {
    state.wordbuf = '';
} ;
export const addWordChar = (state: State, value: string): void => {
    state.wordbuf += value.toLowerCase();
} ;
export const applyPronouns = (state: State): void => {
    if (state.wordbuf === 'it') {
        state.wordbuf = state.wd_it;
    }
    if (state.wordbuf === 'them') {
        state.wordbuf = state.wd_them;
    }
    if (state.wordbuf === 'him') {
        state.wordbuf = state.wd_him;
    }
    if (state.wordbuf === 'her') {
        state.wordbuf = state.wd_her;
    }
    if (state.wordbuf === 'me') {
        state.wordbuf = getName(state);
    }
    if (state.wordbuf === 'myself') {
        state.wordbuf = getName(state);
    }
    if (state.wordbuf === 'there') {
        state.wordbuf = state.wd_there;
    }
} ;
const setPronoun = (state: State, pronoun: string, value: string): void => {
    state[pronoun] = value;
};
export const setIt = (state: State, value: string): void => setPronoun(state, 'wd_it', value);
export const setHim = (state: State, value: string): void => setPronoun(state, 'wd_him', value);
export const setHer = (state: State, value: string): void => setPronoun(state, 'wd_her', value);
export const setThere = (state: State, zone: string, roomId: number): void => setPronoun(state, 'wd_there', `${zone} ${roomId}`);
export const setPlayerPronoun = (state: State, player: Player): void => {
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
        return setIt(state, player.name);
    }
    if (player.sex) {
        setHer(state, player.name);
    } else {
        setHim(state, player.name);
    }
    setPronoun(state, 'wd_them', player.name);
};

