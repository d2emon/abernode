import State from "../state";
import {getDebugMode} from "../parse/reducer";
import {sendKeyboard} from "../bprintf";
import {resetMessages, sendMessage} from "../bprintf/bprintf";
import {getPlayer, Player} from "../support";
import {showMessages} from "../bprintf/output";
import {isWizard} from "../newuaf/reducer";
import {
    enableCalibrate,
    getGameMode, getPrompt,
    isConversationOff,
    isConversationOn,
    isConversationShell,
    isHere, resetEvents,
    setConversationOff, setName
} from "./reducer";
import {setProgramName, withAlarm} from "../gamego/reducer";
import {keyInput} from "../key";
import {loadWorld, saveWorld} from "../opensys";
import {executeCommand} from "../parse/parser";
import {resetFight} from "../blood/reducer";
import {endGame} from "../gamego/endGame";

interface Event {
    v0: number,
    code: number,
    payload: any,
}

const putmeon = (state: State, name: string): Promise<void> => Promise.resolve();
const rte = (state: State, name: string): Promise<void> => Promise.resolve();
const special = (state: State, action: string, name: string): Promise<void> => Promise.resolve();
const sysctrl = (state: State, event: Event, name: string): Promise<void> => Promise.resolve();

const cleanRte = (state: State, name: string) => (): Promise<void> => loadWorld(state)
    .then(() => rte(state, name))
    .then(() => saveWorld(state));

const processEvent = (state: State, event: Event, name: string): Promise<void> => {
    /* Print appropriate stuff from data block */
    const eventCode = getDebugMode(state) ? `\n<${event.code}>` : '';
    if (event.code < -3) {
        return sendMessage(state, eventCode)
            .then(() => sysctrl(state, event, name));
    } else {
        return sendMessage(state, `${eventCode}${event.payload}`);
    }

};

const getInput = (state: State, name: string, player: Player): Promise<boolean> => {
    const prompt = getPrompt(state, player);

    const beforeBottom = (): Promise<void> => showMessages(state);
    const beforeHeader = (): Promise<void> => showMessages(state);
    const showTitle = (): Promise<void> => new Promise((resolve) => {
        if (player.visibility > 9999) {
            setProgramName(state, '-csh');
        } else if (player.visibility === 0) {
            setProgramName(state, `   --}----- ABERMUD -----{--     Playing as ${name}`);
        }
        return resolve();
    });
    const beforeTop = (): Promise<string> => sendMessage(state, prompt)
        .then(() => showMessages(state))
        .then(() => withAlarm(state)(
            () => keyInput(prompt, 80)
        ))
        .then(() => '');

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
            return executeCommand(state, input);
        } else if (input && (input.toLowerCase() !== '.q')) {
            return special(state, input, name);
        }
        return Promise.resolve();
    };

    const checkFightRound = () => Promise.resolve(state.fighting)
        .then(enemyId => (enemyId > -1)
            ? getPlayer(state, enemyId)
            : undefined
        )
        .then((enemy) => {
            if (enemy && (!enemy.exists || !isHere(state, enemy.locationId))) {
                resetFight(state);
            }
            if (state.in_fight) {
                state.in_fight -= 1;
            }
        });

    const processInput = (input: string): Promise<string> => sendMessage(state, sendKeyboard(`${input}\n`))
        .then(cleanRte(state, name))
        .then(applyConversation(input))
        .then(executeInput(input))
        .then(checkFightRound)
        .then(() => input.toLowerCase());

    return beforeBottom()
        .then(beforeHeader)
        .then(showTitle)
        .then(beforeTop)
        .then(processInput)
        .then(input => input === '.q');
};

const start = (state: State, name: string) => Promise.all([
    resetMessages(state),
    Promise.resolve(resetEvents(state)),
    putmeon(state, name),
    Promise.resolve(setName(state, name)),
]);

const checkFull = (state: State) => (): Promise<void> => (state.mynum >= state.maxu)
    ? Promise.reject(new Error('Sorry AberMUD is full at the moment'))
    : Promise.resolve();

const nextTurn = (name: string) => (state: State) => showMessages(state)
    .then(() => getPlayer(state, state.mynum))
    .then(me => getInput(state, name, me))
    .then(() => state.rd_qd && rte(state, name))
    .then(() => {
        state.rd_qd = false;
    })
    .then(() => saveWorld(state))
    .then(() => showMessages(state));

const talker = (state: State, name: string): Promise<(state: State) => void> => start(state, name)
    .then(checkFull(state))
    .then(cleanRte(state, name))
    .then(() => {
        resetEvents(state);
        return special(state, '.g', name);
    })
    .then(() => {
        enableCalibrate(state);
        return nextTurn(name);
    });
