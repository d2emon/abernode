import State from "../state";
import {Person} from "../services/persons";
import {getName} from "../tk/reducer";

const calibme = (state: State): void => undefined;

export const getLevel = (state: State): number => state.my_lev;
export const getScore = (state: State): number => state.my_sco;
export const getSex = (state: State): number => state.my_sex;
export const getSexName = (state: State): string => !state.my_sex ? 'Male' : 'Female';
export const getStrength = (state: State): number => state.my_str;
export const getPerson = (state: State, newPerson: {}): Person => ({
    name: getName(state),
    strength: state.my_str,
    score: state.my_sco,
    level: state.my_lev,
    sex: state.my_sex,
    ...newPerson,
});

export const setLevel = (state: State, value: number): void => {
    state.my_lev = value;
};
export const setScore = (state: State, value: number): void => {
    state.my_sco = value;
};
export const setSex = (state: State, value: number): void => {
    state.my_sex = value;
};
export const setStrength = (state: State, value: number): void => {
    state.my_str = value;
};
export const setPerson = (state: State, person: Person): void => {
    state.my_str = person.strength;
    state.my_sco = person.score;
    state.my_lev = person.level;
    state.my_sex = person.sex;
};

export const updateScore = (state: State, value: number, calibrate: boolean = false): void => {
    state.my_sco += value;
    if (state.my_sco < 0) {
        state.my_str = -1;
    }
    if (calibrate) {
        calibme(state);
    }
};
export const revertSex = (state: State): void => {
    state.my_sex = 1 - state.my_sex;
};
export const updateStrength = (state: State, value: number): void => {
    state.my_str += value;
};

export const isWizard = (state: State): boolean => (state.my_lev >= 10);
export const isGod = (state: State): boolean => (state.my_lev >= 10000);
export const isAdmin = (state: State): boolean => (state.my_lev == 10033);

export const getToHit = (state: State): number => 40 + 3 * state.my_lev;

/*
long my_lev;
*/
