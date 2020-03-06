import State from "../state";
import {getDebugMode} from "../parse/reducer";
import {isWizard} from "../newuaf/reducer";
import {Player} from "../support";

const trapch = (state: State, locationId: number): void => undefined;
const update = (state: State, name: string): void => undefined;

export const getCanCalibrate = (state: State): boolean => state.i_setup;
export const getEventUnset = (state: State): boolean => state.cms === -1;
export const getEventId = (state: State): number => (state.cms === -1) ? undefined : state.cms;
export const getLocationId = (state: State): number => state.curch;
export const getName = (state: State): string => state.globme;
export const getGameMode = (state: State): boolean => state.curmode;
export const isConversationOff = (state: State): boolean => state.convflg === 0;
export const isConversationOn = (state: State): boolean => state.convflg === 1;
export const isConversationShell = (state: State): boolean => state.convflg === 2;
export const isEventsUnprocessed = (state: State): boolean => state.rd_qd;
export const getPlayerId = (state: State): number => state.mynum;

export const disableCalibrate = (state: State): void => {
    state.i_setup = false;
};
export const enableCalibrate = (state: State): void => {
    state.i_setup = true;
};
export const setFaded = (state: State): void => {
    state.cms = -2;
    update(state, state.globme);
};
export const resetEvents = (state: State): void => {
    state.cms = -1;
};
export const setEventId = (state: State, value: number): void => {
    state.cms = value;
};
export const setChannelId = (state: State, value: number): void => {
    state.curch = value;
};
export const setName = (state: State, value: string): void => {
    state.globme = value;
};
export const setGameOn = (state: State): void => {
    state.curmode = true;
};
export const setGameOff = (state: State): void => {
    state.curmode = false;
};
export const setConversationOff = (state: State): void => {
    state.convflg = 0;
};
export const setConversationOn = (state: State): void => {
    state.convflg = 1;
};
export const setConversationShell = (state: State): void => {
    state.convflg = 2;
};
export const setEventsProcessed = (state: State): void => {
    state.rd_qd = false;
};
export const setEventsUnprocessed = (state: State): void => {
    state.rd_qd = true;
};
export const setPlayerId = (state: State, value: number): void => {
    state.mynum = value;
};

export const isHere = (state: State, locationId: number): boolean => (locationId === state.curch);
export const playerIsMe = (state: State, playerId: number): boolean => (playerId === state.mynum);
const basePrompt = (state: State): string => {
    if (isConversationOff(state)) {
        return '>';
    } else if (isConversationOn(state)) {
        return '"';
    } else if (isConversationShell(state)) {
        return '*';
    } else {
        return '?';
    }
};
export const getPrompt = (state: State, player: Player): string => {
    const prompt = (getDebugMode(state) ? '#' : '')
        + (isWizard(state) ? '----' : '')
        + basePrompt(state);
    return player.visibility
        ? `(${prompt})`
        : prompt;
};

