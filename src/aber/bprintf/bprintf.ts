import State from '../state';
import {logger} from '../files';
import Messages from '../services/messages';
import {endGame} from "../gamego/endGame";
import {getName} from "../tk/reducer";
import {looseGame} from "../tk";

export const resetMessages = (state: State): Promise<void > => Messages.createMessages()
    .then((messagesId) => {
        state.messagesId = messagesId;
    })
    .catch(() => endGame(state, 'Out Of Memory'));

export const sendMessage = (state: State, message: string): Promise<void> => {
    const checkMessage = () => {
        /* Max 240 chars/msg */
        if (message.length > 235) {
            return logger.write('Bprintf Short Buffer overflow')
                .then(() => Promise.reject(new Error('Internal Error in BPRINTF')));
        }

        /* Now we have a string of chars expanded */
        if ((message.length + state.sysbuf.length) > 4095) {
            return logger.write(`Buffer overflow on user ${getName(state)}`)
                .then(() => Promise.reject(new Error('PANIC - Buffer overflow')));
        }
    };

    return checkMessage()
        .then(() => Messages.putMessage(state.messagesId, message))
        .catch(error => looseGame(state, actor, error));
};
