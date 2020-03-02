import State from "../state";

export const getDebugMode = (state: State): boolean => state.debug_mode;

export const changeDebugMode = (state: State): void => {
    state.debug_mode = !state.debug_mode;
};
