import State from '../state';

export const getFarted = (state: State) => state.hasfarted;

export const setFarted = (state: State) => {
    state.hasfarted = true;
};