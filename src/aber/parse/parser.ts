import State from "../state";
import {
    resetStop,
    setStringBuffer
} from "./reducer";
import getAction from './actionsList';
import Action from "../action";
import {getPlayer, Player} from "../support";

export const executeCommand = (state: State, commandLine: string, actor: Player): Promise<void> => {
    if (commandLine !== '!') {
        setStringBuffer(state, commandLine);
    }
    if (commandLine === '.q') {
        commandLine = ''; /* Otherwise drops out after command */
    }
    resetStop(state);
    if (!commandLine) {
        return Promise.resolve();
    }
    return Action.nextWord(state)
        .catch(() => Promise.reject(new Error('Pardon ?')))
        .then((action) => Promise.all([
            getAction(action),
            getPlayer(state, actor.playerId),
        ]))
        .then(([
            action,
            actor,
        ]) => action.perform(state, actor));
};
