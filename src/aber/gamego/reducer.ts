import State from '../state';
import {endGame} from './endGame';
import {
    checkPrompt,
    InputData,
} from '../key';
import {showMessages} from "../bprintf/output";
import {onTime} from "../mobile";

const openworld = (state: State): void => undefined;
const closeworld = (state: State): void => undefined;
const loseme = (state: State): void => undefined;
const rte = (state: State, name: string, interrupt: boolean = false): void => undefined;

const NO_ACTION = (): Promise<void> => Promise.resolve();

const SIGHUP = 'SIGHUP';
const SIGINT = 'SIGINT';
const SIGTERM = 'SIGTERM';
const SIGTSTP = 'SIGTSTP';
const SIGQUIT = 'SIGQUIT';
const SIGCONT = 'SIGCONT';
const SIGALRM = 'SIGALRM';

const timerEvent = (state: State) => withNoAlarm(state)(() => {
    openworld(state);

    rte(state, state.globme, true);

    return onTime(state)
        .then(() => {
            closeworld(state);
            return showMessages(state);
        })
        .then(checkPrompt)
        .then((inputData: InputData) => inputData.toPrompt && console.log(`\n${inputData.prompt}${inputData.input}`));
});
const exitEvent = (state: State): Promise<void> => asyncUnsetAlarm(state).then(() => loseme(state));

const onTimer = (state: State): Promise<void> => state.sig_active ? timerEvent(state) : NO_ACTION();
const onError = (state: State, { error }): Promise<void> => exitEvent(state).then(() => Promise.reject(error));
const onExit = (state: State): Promise<void> => {
    console.log('^C\n');
    return state.in_fight
        ? NO_ACTION()
        : exitEvent(state).then(() => endGame(state, 'Byeeeeeeeeee  ...........'));
};

const signals: { [key: string]: (state: State, payload?: any) => Promise<void> } = {
    [SIGHUP]: onError,
    [SIGINT]: onExit,
    [SIGTERM]: onExit,
    [SIGTSTP]: NO_ACTION,
    [SIGQUIT]: NO_ACTION,
    [SIGCONT]: onError,
    [SIGALRM]: NO_ACTION,
};

const blockAlarm = () => {
    signals[SIGALRM] = NO_ACTION;
};

const unblockAlarm = (state: State) => {
    signals[SIGALRM] = onTimer;
    if (state.sig_active) {
        state.alarm = 2;
    }
};

export const setAlarm = (state: State) => {
    state.sig_active = true;
    unblockAlarm(state);
};

const unsetAlarm = (state: State) => {
    state.sig_active = false;
    blockAlarm();
    state.alarm = undefined;
};

export const asyncUnsetAlarm = (state: State): Promise<void> => Promise.resolve(unsetAlarm(state));

export const withoutAlarm = (state: State) => (callback: () => Promise<void>): Promise<void> => Promise.resolve(blockAlarm())
    .then(callback)
    .then(() => unblockAlarm(state));

const withNoAlarm = (state: State) => (callback: () => Promise<any>): Promise<void> => asyncUnsetAlarm(state)
    .then(callback)
    .then(result => {
        setAlarm(state);
        return result;
    });

export const withAlarm = (state: State) => (callback: () => Promise<any>): Promise<void> => Promise.resolve(setAlarm(state))
    .then(callback)
    .then(result => asyncUnsetAlarm(state).then(() => result));

export const setProgramName = (state: State, name: string): void => {
    state.programName = name;
};
