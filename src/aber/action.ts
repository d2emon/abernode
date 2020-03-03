import State from "./state";
import {getPlayer, Player} from "./support";
import {addWordChar, applyPronouns, getCurrentChar, getWordBuffer, nextStop, resetWordBuffer} from "./parse/reducer";
import {checkCrippled, checkIsForced} from "./new1/reducer";

export interface ActionInterface {
    actionId: number,
    action(state: State, actor: Player): Promise<any>,
    check(state: State, actor: Player): Promise<void>,
    decorate(result: any): void,
    output(message: string): void,
    perform(state: State): Promise<void>,
}

class Action implements ActionInterface {
    actionId = undefined;

    constructor(actionId?: number) {
        this.actionId = actionId;
    }

    static checkCrippled = (state: State): Promise<void> => checkCrippled(state)
        .then(() => null);

    static checkIsForced = (state: State, message?: string): Promise<void> => checkIsForced(state, message)
        .then(() => null);

    static checkFight = (state: State, message: string): Promise<void> => (
        (state.in_fight)
            ? Promise.reject(new Error(message))
            : Promise.resolve()
    );

    static nextWord(state: State): Promise<string> {
        resetWordBuffer(state);
        while(getCurrentChar(state) === ' ') {
            nextStop(state);
        }
        while(getCurrentChar(state) && (getCurrentChar(state) !== ' ')) {
            addWordChar(state, getCurrentChar(state));
        }
        applyPronouns(state);
        const word = getWordBuffer(state);
        return word
            ? Promise.resolve(word)
            : Promise.reject(new Error());
    }

    action(state: State, actor: Player): Promise<any> {
        return Promise.reject(new Error('Not implemented'));
    };

    check(state: State, actor: Player): Promise<void> {
        return Promise.resolve();
    }

    decorate(result: any): void {
        return;
    };

    output(message: string): void {
        console.log(message)
    }

    perform(state: State, actor: Player): Promise<void> {
        return this.check(state, actor)
            .then(() => this.action(state, actor))
            .then(this.decorate)
            .catch(e => this.output(`${e}\n`));
    }
}

export default Action;
