import State from '../state';
import {Player} from '../support';
import {
    canSeePlayer,
    setName,
} from './player';
import {
    getIsKeyboard,
    setIsKeyboard,
    unsetIsKeyboard,
    getLogFile,
    getNeedLineBreak,
    unsetNeedLineBreak,
    setNeedPrompt,
    getSnooper,
    getSnooped,
} from './reducer';
import {
    viewSnoop,
    writeSnoop,
} from './snoop';
import Messages from '../services/messages';
import Log from '../services/log';

const block_alarm = (state: State): void => undefined;
const unblock_alarm = (state: State): void => undefined;
const closeworld = (state: State): void => undefined;
const f_listfl = (fileName: string): string => '';
const isdark = (state: State, locationId: number): boolean => false;

const seePlayerName = (state: State, player: Player): boolean => {
    const canSee = canSeePlayer(state, player);
    if (canSee) {
        setName(state, player);
    }
    return canSee;
};

// Replacers

const replaceFile = (state: State) => (match, fileName: string): string => {
    let result = '';
    if (state.debug_mode) {
        result += `[FILE ${fileName} ]\n`;
    }
    result += f_listfl(fileName);
    return result
};
const replaceSound = (state: State) => (match, message: string): string => (state.ail_deaf ? message : '');
const replaceVisiblePlayer = (state: State) => (match, player: Player, message: string): string => (
    seePlayerName(state, player)
        ? message
        : ''
);
const replaceName = (state: State) => (match, player: Player): string => (
    seePlayerName(state, player)
        ? player.name
        : 'Someone'
);
const replaceDark = (state: State) => (match, message: string): string => (
    (!isdark(state, state.curch) && !state.ail_blind) ? message : ''
);
const replaceSoundPlayer = (state: State) => (match, player: Player): string => (
    state.ail_deaf
        ? ''
        : replaceName(state)(match, player)
);
const replaceSeePlayer = (state: State) => (match, player: Player): string => (
    state.ail_blind
        ? ''
        : replaceName(state)(match, player)
);
const replaceNotKeyboard = (state: State) => (match, message: string): string => (
    getIsKeyboard(state)
        ? ''
        : message
);

// The main loop

const decode = (state: State, text: string, isKeyboard: boolean = true): string => {
    if (isKeyboard) {
        setIsKeyboard(state);
    } else {
        unsetIsKeyboard(state);
    }

    text.replace(/\[f](.{0,128})\[\/f]/, replaceFile(state));
    text.replace(/\[d](.{0,256})\[\/d]/, replaceSound(state));
    text.replace(/\[s playerId="(.{0,23})"](.{0,256})\[\/s]/, replaceVisiblePlayer(state));
    text.replace(/\[p playerId="(.{0,24})"\/]/, replaceName(state));
    text.replace(/\[c](.{0,256})\[\/c]/, replaceDark(state));
    text.replace(/\[P](.{0,24})\[\/P]/, replaceSoundPlayer(state));
    text.replace(/\[D](.{0,24})\[\/D]/, replaceSeePlayer(state));
    text.replace(/\[l](.{0,127})\[\/l]/, replaceNotKeyboard(state));
    return text;
};

const decodeLog = (state: State, messages: string) => Promise.resolve(getLogFile(state))
    .then((logFile) => {
        if (!logFile) {
            return
        }
        return Log.writeLog(decode(state, messages, false));
    });
const decodeSnoop = (state: State, messages: string) => getSnooper(state)
    .then((snooper) => {
        if (!snooper) {
            return
        }
        return writeSnoop(snooper.name, decode(state, messages, false));
    })
    .catch(() => null);
const decodeScreen = (state: State, messages: string) => {
    if (messages) {
        setNeedPrompt(state);
        if (getNeedLineBreak(state)) {
            console.log('\n');
        }
    }
    unsetNeedLineBreak(state);
    console.log(decode(state, messages, true));
    return Promise.resolve();
};

export const showMessages = (state: State): Promise<void> => {
    block_alarm(state);
    closeworld(state);
    return Messages.getMessages(state.messagesId)
        .then(messages => Promise.all([
            decodeLog(state, messages),
            decodeSnoop(state, messages),
            decodeScreen(state, messages),
        ]))
        // Clear buffer
        .then(() => Messages.clearMessages(state.messagesId))
        // Show snooped
        .then(() => getSnooped(state))
        .then(snooped => snooped && viewSnoop(state, snooped))
        .then(() => unblock_alarm(state));
};
