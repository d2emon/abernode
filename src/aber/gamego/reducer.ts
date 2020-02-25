import State from "../state";
import {endGame} from "./endGame";

const openworld = (state: State): void => undefined;
const closeworld = (state: State): void => undefined;
const key_reprint = (state: State): void => undefined;
const keysetback = (state: State): void => undefined;
const loseme = (state: State): void => undefined;
const on_timing = (state: State): void => undefined;
const rte = (state: State, name: string, interrupt: boolean = false): void => undefined;

const NO_ACTION = (): Promise<void> => Promise.resolve();

const SIGHUP = 'SIGHUP';
const SIGINT = 'SIGINT';
const SIGTERM = 'SIGTERM';
const SIGTSTP = 'SIGTSTP';
const SIGQUIT = 'SIGQUIT';
const SIGCONT = 'SIGCONT';
const SIGALRM = 'SIGALRM';

const onTimer = (state: State): Promise<void >=> {
    if (!state.sig_active) {
        return NO_ACTION();
    }
    return asyncUnsetAlarm(state)
        .then(() => {
            openworld(state);

            rte(state, state.globme, true);

            on_timing(state);
            closeworld(state);
            key_reprint(state);
        })
        .then(() => setAlarm(state));
};

const onError = (state: State, { error }): Promise<void> => asyncUnsetAlarm(state)
    .then(() => {
        loseme(state);
        keysetback(state);
        return Promise.reject(error);
    });

const onExit = (state: State): Promise<void> => {
    console.log('^C\n');
    if (state.in_fight) {
        return NO_ACTION();
    }
    return asyncUnsetAlarm(state)
        .then(() => {
            loseme(state);
            return endGame(state, 'Byeeeeeeeeee  ...........');
        });
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
    .then(() => setAlarm(state));

export const setProgramName = (state: State, name: string): void => {
    state.programName = name;
};
