import State from '../state';
import {logger} from "../files";

const talker = (state: State, name: string): void => undefined;
const cuserid = (state: State): string => '';

/**
 * Two Phase Game System
 */

export const main = (state: State, programName: string, name: string): Promise<void> => {
    name = (name === 'Phantom') ? `The ${name}` : name;
    console.log('Entering Game ....\n');
    console.log(`Hello ${name}\n`);
    return logger.write(`GAME ENTRY: ${name}[${cuserid(state)}]`)
        .then(() => {
            state.globme = name;
            talker(state, state.globme);
        });
};