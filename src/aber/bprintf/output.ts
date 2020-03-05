import State from '../state';
import {Player} from '../support';
import {
    canSeePlayer,
} from './player';
import {
    getIsKeyboard,
    setIsKeyboard,
    unsetIsKeyboard,
    getLogFile,
    getSnooper,
    getSnooped,
} from './reducer';
import {
    viewSnoop,
    writeSnoop,
} from './snoop';
import Messages from '../services/messages';
import Log from '../services/log';
import {withoutAlarm} from '../gamego/reducer';
import {
    checkLineBreak,
    clearLineBreak,
} from '../key';
import {getBlind, getDeaf} from "../new1/reducer";
import {saveWorld} from "../opensys";
import {getDebugMode, setPlayerPronoun} from "../parse/reducer";
import {getLocationId} from "../tk/reducer";

const f_listfl = (fileName: string): string => '';
const isdark = (state: State, locationId: number): boolean => false;

const seePlayerName = (state: State, player: Player): boolean => {
    const canSee = canSeePlayer(state, player);
    if (canSee) {
        setPlayerPronoun(state, player);
    }
    return canSee;
};

// Replacers

const replaceFile = (state: State) => (match, fileName: string): string => {
    let result = '';
    if (getDebugMode(state)) {
        result += `[FILE ${fileName} ]\n`;
    }
    result += f_listfl(fileName);
    return result
};
const replaceSound = (state: State) => (match, message: string): string => (getDeaf(state) ? message : '');
const replaceVisiblePlayer = (state: State) => (match, player: Player, message: string): string => (
    seePlayerName(state, player) ? message : ''
);
const replaceName = (state: State) => (match, player: Player): string => (
    seePlayerName(state, player) ? player.name : 'Someone'
);
const replaceDark = (state: State) => (match, message: string): string => (
    (isdark(state, getLocationId(state)) || getBlind(state)) ? '' : message
);
const replaceSoundPlayer = (state: State) => (match, player: Player): string => (
    getDeaf(state) ? '' : replaceName(state)(match, player)
);
const replaceSeePlayer = (state: State) => (match, player: Player): string => (
    getBlind(state) ? '' : replaceName(state)(match, player)
);
const replaceNotKeyboard = (state: State) => (match, message: string): string => (
    getIsKeyboard(state) ? '' : message
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
    if (messages && checkLineBreak().needLineBreak) {
        console.log('\n');
    }
    clearLineBreak();

    console.log(decode(state, messages, true));
    return Promise.resolve();
};

export const showMessages = (state: State): Promise<void> => withoutAlarm(state)(()=> saveWorld(state)
    .then(() => Messages.getMessages(state.messagesId))
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
);
