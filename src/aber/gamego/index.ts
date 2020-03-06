import State from '../state';
import {logger} from '../files';
import talker, {
    GameData,
} from '../tk/talker';
import {setProgramName} from "./reducer";
import {looseGame} from "../tk";
import {endGame} from "./endGame";

const cuserid = (state: State): string => '';

/**
 * Two Phase Game System
 */

export const main = (state: State, programName: string, name: string): Promise<GameData> => {
    setProgramName(state, programName);
    name = (name === 'Phantom') ? `The ${name}` : name;
    console.log('Entering Game ....\n');
    console.log(`Hello ${name}\n`);
    return logger.write(`GAME ENTRY: ${name}[${cuserid(state)}]`)
        .then(() => talker(state, name));
};
