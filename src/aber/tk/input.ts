import State from "../state";
import Battle from "../blood/battle";
import {
    Player,
    getPlayer,
} from "../support";
import {
    getGameMode,
    getName,
    getPrompt,
    isConversationOff,
    isConversationOn,
    isConversationShell, isHere,
    setConversationOff
} from "./reducer";
import {
    setProgramName,
    withAlarm,
} from "../gamego/reducer";
import {keyInput} from "../key";
import {
    sendAndShow,
    showMessages,
} from "../bprintf/output";
import {executeCommand} from "../parse/parser";
import {sendKeyboardMessage} from "../bprintf";
import {processAndSave} from "./index";
import {executeSpecial} from "./actions";

const getTitle = (player: Player, name: string): string => {
    if (player.visibility > 9999) {
        return '-csh';
    } else if (player.visibility === 0) {
        return `   --}----- ABERMUD -----{--     Playing as ${name}`;
    } else {
        return undefined;
    }
};

const beforeInput = (state: State, player: Player): Promise<State> => {
    const bottom = (state: State): Promise<State> => showMessages(state)
        .then(() => state);
    const header = (state: State): Promise<State> => showMessages(state)
        .then(() => state);
    const title = (state: State): Promise<State> => Promise
        .resolve(setProgramName(state, getTitle(player, getName(state))))
        .then(() => state);

    return Promise.resolve(state)
        .then(bottom)
        .then(header)
        .then(title)
};
const onInput = (player: Player) => (state: State): Promise<string> => {
    const prompt = getPrompt(state, player);
    const alarmKeyInput = () => withAlarm(state)(() => keyInput(prompt, 80));
    return sendAndShow(state, prompt)
        .then(alarmKeyInput);
};
const afterInput = (state: State, player: Player) => (input: string): Promise<boolean> => {
    const process = () => processAndSave(state, player);
    const applyConversation = (input: string) => (): string => {
        if (!input) {
            return '';
        } else if (!isConversationOff(state) && (input === '**')) {
            setConversationOff(state);
            return '';
        } else if ((input !== '*') && (input[0] === '*')) {
            return input.substr(1);
        } else if (isConversationOn(state)) {
            return `say ${input}`;
        } else if (isConversationShell(state)) {
            return `tss ${input}`;
        }
    };
    const executeInput = (input: string) => (): Promise<void> => {
        if (getGameMode(state)) {
            return executeCommand(state, input, player);
        } else if (input && (input.toLowerCase() !== '.q')) {
            return executeSpecial(state, input, player)
                .then(() => null);
        }
        return Promise.resolve();
    };
    const checkFightRound = () => Battle.getEnemy(state)
        .then(enemy => ((enemy && (!enemy.exists || !isHere(state, enemy.locationId)))
            ? Battle.stopFight(state)
            : Battle.updateFight(state)
        ));

    return sendKeyboardMessage(state, `${input}\n`)
        .then(process)
        .then(applyConversation(input))
        .then(executeInput(input))
        .then(checkFightRound)
        .then(() => input.toLowerCase() === '.q');
};

const getInput = (state: State, player: Player): Promise<boolean> => beforeInput(state, player)
    .then(onInput(player))
    .then(afterInput(state, player));

export default getInput;
