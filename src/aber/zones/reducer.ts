import State from "../state";

export const getExits = (state: State): number[] => state.ex_dat;
export const getExit = (state: State, directionId: number): number => state.ex_dat[directionId];

export const setExits = (state: State, value: number[]): void => value.forEach((value, exitId) => {
    state.ex_dat[exitId] = value;
});
