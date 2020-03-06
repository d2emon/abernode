import State from "../state";
import {
    enableCalibrate,
    getName, getPlayerId,
    resetEvents,
    setName,
} from "./reducer";
import {showMessages} from "../bprintf/output";
import {getPlayer, Player} from "../support";
import getInput from './input';
import {resetMessages} from "../bprintf/bprintf";
import {processAndSave} from "./index";
import {executeSpecial} from "./actions";

const putmeon = (state: State, name: string): Promise<void> => Promise.resolve();

const start = (state: State, name: string): Promise<State> => Promise.all([
    resetMessages(state),
    Promise.resolve(resetEvents(state)),
    putmeon(state, name),
    Promise.resolve(setName(state, name)),
])
    .then(() => state);

const checkFull = (state: State): Promise<State> => (getPlayerId(state) >= state.maxu)
    ? Promise.reject(new Error('Sorry AberMUD is full at the moment'))
    : Promise.resolve(state);

const startPlayer = (state: State): Promise<State> => Promise.resolve(resetEvents(state))
    .then(() => getPlayer(state, getPlayerId(state)))
    .then(player => executeSpecial(state, '.g', player))
    .then(() => enableCalibrate(state))
    .then(() => state);

const nextTurn = (state: State, player: Player) => showMessages(state)
    .then(() => getInput(state, player))
    .then(() => processAndSave(state, getName(state),  true))
    .then(() => showMessages(state));

const talker = (initialState: State, name: string): Promise<(state: State, player: Player) => void> => start(initialState, name)
    .then(checkFull)
    .then(processAndSave)
    .then(startPlayer)
    .then(() => nextTurn);
