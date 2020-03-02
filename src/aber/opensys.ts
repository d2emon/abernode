import State from "./state";
import {endGame} from "./gamego/endGame";
import World from './services/world';

/* Fast File Controller v0.1 */

export const saveWorld = (state: State): Promise<any> => state.filrf
    ? Promise.all([
            World.writeItems(state.objinfo),
            World.writePlayers(state.ublock),
        ])
        .then(() => {
            state.filrf = null;
        })
    : Promise.resolve();

export const loadWorld = (state: State): Promise<any> => state.filrf
    ? Promise.resolve()
    : Promise.all([
            World.readItems(),
            World.readPlayers(),
        ])
        .then(([
            items,
            players,
        ]) => {
            state.objinfo = items;
            state.ublock = players;
            state.filrf = {};
        })
        .catch(() => endGame(state, 'Cannot find World file'));