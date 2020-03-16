import State from '../state';
import {endGame} from './endGame';
import {
    checkPrompt,
    InputData,
} from '../key';
import {showMessages} from "../bprintf/output";
import {onTime} from "../mobile";
import {saveWorld} from "../opensys";
import {getName} from "../tk/reducer";
import {looseGame, processEvents} from "../tk";
import {Player} from "../support";
import Battle from "../blood/battle";

const NO_ACTION = (): Promise<void> => Promise.resolve();

const SIGHUP = 'SIGHUP';
const SIGINT = 'SIGINT';
const SIGTERM = 'SIGTERM';
const SIGTSTP = 'SIGTSTP';
const SIGQUIT = 'SIGQUIT';
const SIGCONT = 'SIGCONT';
const SIGALRM = 'SIGALRM';

const timerEvent = (state: State, actor: Player): Promise<void> => withNoAlarm(state)(
    () => processEvents(state, actor, true)
        .then(() => onTime(state, actor))
        .then(() => saveWorld(state))
        .then(() => showMessages(state))
        .then(checkPrompt)
        .then((inputData: InputData) => inputData.toPrompt && console.log(`\n${inputData.prompt}${inputData.input}`))
);

const onTimer = (state: State, actor: Player): Promise<void> => state.sig_active
    ? timerEvent(state, actor)
    : NO_ACTION();
const onError = (state: State, actor: Player, { error }): Promise<void> => looseGame(state, actor, error);
const onExit = (state: State, actor: Player): Promise<void> => {
    console.log('^C\n');
    return Battle(state).inBattle
        ? NO_ACTION()
        : looseGame(state, actor, 'Byeeeeeeeeee  ...........');
};

const signals: { [key: string]: (state: State, actor: Player, payload?: any) => Promise<void> } = {
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

export const withAlarm = (state: State) => (callback: () => Promise<any>): Promise<any> => Promise.resolve(setAlarm(state))
    .then(callback)
    .then(result => asyncUnsetAlarm(state).then(() => result));

export const setProgramName = (state: State, name: string): void => {
    state.programName = name;
};
