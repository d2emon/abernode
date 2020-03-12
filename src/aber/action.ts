import State from "./state";
import {getPlayer, Item, Player} from "./support";
import {addWordChar, applyPronouns, getCurrentChar, getWordBuffer, nextStop, resetWordBuffer} from "./parse/reducer";
import {checkCrippled, checkIsForced} from "./new1/reducer";
import {isHere, playerIsMe} from "./tk/reducer";
import Battle from "./blood/battle";

type Validator = (state: State, actor: Player, actionId: number) => Promise<boolean>;

export interface ActionInterface {
    actionId: number,
    validators: Validator[],
    action(state: State, actor: Player, args:any): Promise<any>,
    check(state: State, actor: Player): Promise<void>,
    decorate(result: any): void,
    getArgs(state: State, actor: Player): Promise<any>,
    output(message: string): void,
    perform(state: State, actor: Player): Promise<void>,
}

class Action implements ActionInterface {
    actionId = undefined;

    validators = [];

    constructor(actionId?: number) {
        this.actionId = actionId;
    }

    // Validators
    static checkCrippled = (state: State): Promise<void> => checkCrippled(state)
        .then(() => null);

    static checkIsForced = (state: State, message?: string): Promise<void> => checkIsForced(state, message)
        .then(() => null);

    static checkFight = (state: State, message: string): Promise<void> => (Battle.isBattle(state)
        ? Promise.reject(new Error(message))
        : Promise.resolve()
    );

    static checkItem = (item: Item, message: string): Promise<Item> => (item
        ? Promise.reject(new Error(message))
        : Promise.resolve(item)
    );

    static checkPlayer = (player: Player, message: string): Promise<Player> => (player
        ? Promise.reject(new Error(message))
        : Promise.resolve(player)
    );

    static checkNotMe = (state: State, player: Player, message: string): Promise<Player> => (playerIsMe(
            state,
            player.playerId
        )
        ? Promise.reject(new Error(message))
        : Promise.resolve(player)
    );

    static checkHere = (state: State, channelId: number, message: string): Promise<void> => (isHere(state, channelId)
        ? Promise.resolve()
        : Promise.reject(new Error(message))
    );

    static nextWord(state: State, message?: string): Promise<string> {
        resetWordBuffer(state);
        while(getCurrentChar(state) === ' ') {
            nextStop(state);
        }
        while(getCurrentChar(state) && (getCurrentChar(state) !== ' ')) {
            addWordChar(state, getCurrentChar(state));
        }
        applyPronouns(state);
        const word = getWordBuffer(state);
        return (word || (message === undefined))
            ? Promise.resolve(word)
            : Promise.reject(new Error(message));
    }

    action(state: State, actor: Player, args:any): Promise<any> {
        return Promise.reject(new Error('Not implemented'));
    };

    check(state: State, actor: Player): Promise<void> {
        return Promise.all(this.validators.map(validator => validator(state, actor, this.actionId)))
            .then(() => null);
    }

    decorate(result: any): void {
        return;
    };

    getArgs(state: State, actor: Player): any {
        return {};
    }

    output(message: string): void {
        console.log(message)
    }

    perform(state: State, actor: Player, isForced?: boolean): Promise<void> {
        if (isForced !== undefined) {
            state.isforce = isForced;
        }
        return this.check(state, actor)
            .then(() => this.getArgs(state, actor))
            .then(args => this.action(state, actor, args))
            .then(this.decorate)
            .catch(e => this.output(`${e}\n`));
    }
}

export default Action;
