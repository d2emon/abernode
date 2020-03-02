import State from "../state";
import {showMessages} from "../bprintf/output";
import {setNeedPrompt} from "../bprintf/reducer";

const stopGame = (code: number): void => undefined;

const dashes = '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-';

export const endGame = (state: State, message: string): Promise<void> => showMessages(state)
    .then(() => {
        setNeedPrompt(state); /* So we dont get a prompt after the exit */
        console.log();
        console.log(dashes);
        console.log();
        console.log(message);
        console.log();
        console.log(dashes);
        stopGame(0);
        throw new Error(message);
    });
