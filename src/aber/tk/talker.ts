import State from "../state";
import {
    enableCalibrate, getLocationId,
    getName, getPlayerId,
    resetEvents,
    setName, setPlayerId,
} from "./reducer";
import {showMessages} from "../bprintf/output";
import {getPlayer, getPlayers, Player, setPlayer} from "../support";
import getInput from './input';
import {resetMessages} from "../bprintf/bprintf";
import {processAndSave} from "./index";
import {executeSpecial} from "./actions";
import {loadWorld} from "../opensys";
import {findPlayer} from "../objsys";
import {endGame} from "../gamego/endGame";

export type NextTurn = (state: State, actor: Player) => Promise<void>;

export interface GameData {
    actor: Player,
    turn: NextTurn,
}

const talker = (state: State, name: string): Promise<GameData> => {
    const checkExists = (): Promise<State> => findPlayer(state, name)
        .then(player => player && endGame(state, 'You are already on the system - you may only be on once at a time'))
        .then(() => state);

    const addPlayer = (playerId: number): Promise<State> => setPlayer(
        state,
        playerId,
        {
            name,
            locationId: getLocationId(state),
            level: 1,
            strength: -1,
            visibility: 0,
            sex: 0,
            eventId: -1,
            weaponId: -1,
        }
    )
        .then(() => {
            resetEvents(state);
            setPlayerId(state, playerId);
            setName(state, name);
        })
        .then(() => resetMessages(state))
        .then(() => state);

    const newPlayer = (state: State): Promise<State> => getPlayers(state, state.maxu)
        .then(players => players.find(player => !player.exists))
        .then(player => player
            ? addPlayer(player.playerId)
            : Promise.reject(new Error('Sorry AberMUD is full at the moment'))
        );

    const afterAdd = (state: State): Promise<State> => new Promise((resolve) => {
        resetEvents(state);
        return resolve(state);
    });

    const startPlayer = (state: State): Promise<Player> => getPlayer(state, getPlayerId(state))
        .then(player => executeSpecial(state, '.g', player))
        .then(() => enableCalibrate(state))
        .then(() => getPlayer(state, getPlayerId(state)));

    const turnDecorator = (state: State, callback): Promise<void> => showMessages(state)
        .then(callback)
        .then(() => processAndSave(state, getName(state),  true))
        .then(() => showMessages(state));

    const getGameData = (actor: Player): GameData => ({
        actor,
        turn: (state: State, actor: Player) => turnDecorator(
            state,
            () => getInput(state, actor),
        )
    });

    return loadWorld(state)
        .then(checkExists)
        .then(newPlayer)
        .then(processAndSave)
        .then(afterAdd)
        .then(startPlayer)
        .then(getGameData);
};

export default talker
