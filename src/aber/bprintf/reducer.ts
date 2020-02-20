import State from '../state';
import {
    Player,
    getPlayer,
} from '../support';

export const clearMessages = (state: State): void => {
    state.sysbuf = '';
};
export const addMessage = (state: State, message: string): void => {
    state.sysbuf += message;
};
export const getMessages = (state: State): string => state.sysbuf;

export const getLogFile = (state: State): any => state.log_fl;
export const setLogFile = (state: State, logFile: any): void => {
    state.log_fl = logFile;
};

export const getIsKeyboard = (state: State): boolean => state.iskb;
export const setIsKeyboard = (state: State): void => {
    state.iskb = true;
};
export const unsetIsKeyboard = (state: State): void => {
    state.iskb = false;
};

export const setNeedPrompt = (state: State): void => {
    state.pr_due = false;
};

export const getNeedLineBreak = (state: State): boolean => state.pr_qcr;
export const unsetNeedLineBreak = (state: State): void => {
    state.pr_qcr = false;
};

export const getSnooper = (state: State): Promise<Player> => getPlayer(state, state.snoopd);

export const getSnooped = (state: State): Promise<Player> => getPlayer(state, state.snoopt);
export const stopSnoop = (state: State): void => {
    state.snoopt = -1;
};
export const startSnoop = (state: State, player?: Player): void => {
    state.snoopt = player ? player.playerId : -1;
};
