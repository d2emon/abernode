import State from '../state';
import {
    Player,
    getPlayer,
} from '../support';
import {
    canSeePlayer,
    resetMessages,
    setName,
} from './bprintf';

const fprintf = (file: any, data: any): Promise<void> => Promise.resolve();
const fclose = (file: any): Promise<void> => Promise.resolve();

const block_alarm = (state: State): void => undefined;
const unblock_alarm = (state: State): void => undefined;
const closeworld = (state: State): void => undefined;
const viewsnoop = (state: State): void => undefined;
const f_listfl = (fileName: string): string => '';
const isdark = (state: State, locationId: number): boolean => false;
const opensnoop = (fileName: string, mode: string): Promise<any> => Promise.resolve({});

const getMessages = (state: State): string => state.sysbuf;

const getIsKeyboard = (state: State): boolean => state.iskb;
const setIsKeyboard = (state: State): void => {
    state.iskb = true;
};
const unsetIsKeyboard = (state: State): void => {
    state.iskb = false;
};

const setNeedPrompt = (state: State): void => {
    state.pr_due = false;
};

const getNeedLineBreak = (state: State): boolean => state.pr_qcr;
const unsetNeedLineBreak = (state: State): void => {
    state.pr_qcr = false;
};

const getLogFile = (state: State): any => state.log_fl;

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

const decode = (state: State, text: string, file: any, isKeyboard: boolean = true): Promise<void> => {
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
    return fprintf(file, text);
};

export const showMessages = (state: State): Promise<void> => {
    const decodeLog = (messages: string) => Promise.resolve(getLogFile(state))
        .then(logFile => logFile && decode(state, messages, logFile, false));
    const decodeSnoop = (messages: string) => getPlayer(state, state.snoopd)
        .then((snooper) => snooper && opensnoop(snooper.name, 'a'))
        .then((fln) => fln && decode(state, messages, fln, false).then(() => fclose(fln)))
        .catch(() => null);
    const decodeScreen = (messages: string) => {
        if (messages) {
            setNeedPrompt(state);
            if (getNeedLineBreak(state)) {
                messages = `\n${messages}`;
            }
        }
        unsetNeedLineBreak(state);
        return decode(state, messages, null, true);
    };

    block_alarm(state);
    closeworld(state);
    return Promise.resolve(getMessages(state))
        .then(messages => Promise.all([
            decodeLog(messages),
            decodeSnoop(messages),
            decodeScreen(messages),
        ]))
        /* clear buffer */
        .then(() => resetMessages(state))
        .then(() => {
            if (state.snoopt !== -1) {
                viewsnoop(state);
            }
            unblock_alarm(state);
        });
};
