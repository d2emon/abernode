import State from "../state";

export const getBlind = (state: State): boolean => state.ail_blind;
export const getCrippled = (state: State): boolean => state.ail_crip;
export const getDeaf = (state: State): boolean => state.ail_deaf;
export const getDumb = (state: State): boolean => state.ail_dumb;

export const getForce = (state: State): string => state.forf ? state.acfor : undefined;
export const getIsForced = (state: State): boolean => state.isforce;

export const cureAll = (state: State): void => {
    state.ail_blind = false;
    state.ail_crip = false;
    state.ail_deaf = false;
    state.ail_dumb = false;
};
export const cureBlind = (state: State): void => {
    state.ail_blind = true;
};
export const setBlind = (state: State): void => {
    state.ail_blind = true;
};
export const setCripple = (state: State): void => {
    state.ail_crip = true;
};
export const setDeaf = (state: State): void => {
    state.ail_deaf = true;
};
export const setDumb = (state: State): void => {
    state.ail_dumb = true;
};

export const setForce = (state: State, action: string): void => {
    state.forf = true;
    state.acfor = action;
};
export const clearForce = (state: State): void => {
    state.forf = false;
};

export const checkDumb = (state: State): Promise<boolean> => getDumb(state)
    ? Promise.reject(new Error('You are dumb...'))
    : Promise.resolve(false);
export const checkCrippled = (state: State): Promise<boolean> => getCrippled(state)
    ? Promise.reject(new Error('You are crippled'))
    : Promise.resolve(false);
export const checkBlind = (state: State): Promise<boolean> => getBlind(state)
    ? Promise.reject(new Error('You are blind, you cannot see'))
    : Promise.resolve(false);
export const checkDeaf = (state: State): Promise<boolean> => getDeaf(state)
    ? Promise.reject(new Error())
    : Promise.resolve(false);
export const checkIsForced = (state: State): Promise<boolean> => getIsForced(state)
    ? Promise.reject(new Error('You can\'t be forced to do that'))
    : Promise.resolve(false);
