import State from "../state";
import {
    enableCalibrate,
    getName,
    resetEvents,
    setName,
} from "./reducer";
import {showMessages} from "../bprintf/output";
import {Player} from "../support";
import getInput from './input';
import {resetMessages} from "../bprintf/bprintf";
import {processAndSave} from "./index";

const putmeon = (state: State, name: string): Promise<void> => Promise.resolve();
const special = (state: State, action: string, name: string): Promise<void> => Promise.resolve();

const start = (state: State, name: string): Promise<State> => Promise.all([
    resetMessages(state),
    Promise.resolve(resetEvents(state)),
    putmeon(state, name),
    Promise.resolve(setName(state, name)),
])
    .then(() => state);

const checkFull = (state: State): Promise<State> => (state.mynum >= state.maxu)
    ? Promise.reject(new Error('Sorry AberMUD is full at the moment'))
    : Promise.resolve(state);

const startPlayer = (state: State): Promise<State> => {
    resetEvents(state);
    return special(state, '.g', getName(state))
        .then(() => enableCalibrate(state))
        .then(() => state);
};

const nextTurn = (state: State, player: Player) => showMessages(state)
    .then(() => getInput(state, player))
    .then(() => processAndSave(state, getName(state),  true))
    .then(() => showMessages(state));

const talker = (initialState: State, name: string): Promise<(state: State, player: Player) => void> => start(initialState, name)
    .then(checkFull)
    .then(processAndSave)
    .then(startPlayer)
    .then(() => nextTurn);
