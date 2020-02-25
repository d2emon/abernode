import State from '../state';
import {logger} from '../files';
import Messages from '../services/messages';
import {endGame} from "../gamego/endGame";

const loseme = (state: State): void => undefined;

export const resetMessages = (state: State): Promise<void > => Messages.createMessages()
    .then((messagesId) => {
        state.messagesId = messagesId;
    })
    .catch(() => endGame(state, 'Out Of Memory'));

export const sendMessage = (state: State, message: string): Promise<void> => {
    /* Max 240 chars/msg */
    if (message.length > 235) {
        return logger.write('Bprintf Short Buffer overflow')
            .then(() => endGame(state, 'Internal Error in BPRINTF'));
    }

    /* Now we have a string of chars expanded */
    if ((message.length + state.sysbuf.length) > 4095) {
        loseme(state);
        return logger.write(`Buffer overflow on user ${state.globme}`)
            .then(() => endGame(state, 'PANIC - Buffer overflow'))
    }

    return Messages.putMessage(state.messagesId, message);
};
