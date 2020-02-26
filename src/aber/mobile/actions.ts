import Action from '../action';
import State from '../state';
import {brkword, sendsys} from "../__dummies";
import {sendSound, sendSoundPlayer} from "../bprintf";
import {findAvailableItem} from "../objsys";
import {getItems} from "../support";
import {showMessages} from "../bprintf/output";

const chkdumb = (state: State): boolean => false;
const rescom = (state: State): Promise<any> => Promise.resolve({});
const sillycom = (state: State, message: string): Promise<any> => Promise.resolve({});
const vichere = (state: State): number[] => [0, 0];
const findzone = (state: State, locationId: number): number[] => [0, 0];

export class Crash extends Action {
    action(state: State): Promise<any> {
        if (state.my_lev < 10) {
            throw new Error('Hmmm....\nI expect it will sometime');
        }
        sendsys(
            state,
            null,
            null,
            -666,
            null,
            null,
        );
        return rescom(state);
    }

    decorate(result: any): void {
        this.output('Bye Bye Cruel World...\n');
    }
}

export class Sing extends Action {
    action(state: State): Promise<any> {
        if (chkdumb(state)) {
            throw new Error();
        }
        return sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' sings in Gaelic\n')}`);
    }

    decorate(result: any): void {
        this.output('You sing\n');
    }
}

export class Spray extends Action {
    action(state: State): Promise<any> {
        const [b, playerId] = vichere(state);
        if (b === -1) {
            throw new Error();
        }
        if (brkword(state) === -1) {
            throw new Error('With what ?');
        }
        if (state.wordbuf === 'with') {
            if (brkword(state) === -1) {
                throw new Error('With what ?');
            }
        }
        return findAvailableItem(state, state.wordbuf)
            .then((item) => {
                if (!item) {
                    throw new Error('With what ?');
                }
                throw new Error('You can\'t do that');
            })
    }
}

export class Direction extends Action {
    action(state: State): Promise<any> {
        if (state.my_lev < 10) {
            throw new Error('That\'s a wiz command');
        }
        return getItems(state)
            .then((items) => items.map((item) => {
                const [b, c] = findzone(state, item.locationId);
                let d = `${b}${c}`;
                if (item.heldBy !== undefined) {
                    d += ' CARRIED';
                }
                if (item.containedIn !== undefined) {
                    d += ' IN ITEM';
                }
                return `${item.name} ${d}`;
            }))
            .then(items => ({
                state,
                items,
            }));
    }

    decorate(result: any): void {
        const {
            state,
            items,
        } = result;
        items.forEach((item, itemId) => {
            this.output(item);
            if ((itemId % 3) === 2) {
                this.output('\n');
            }
            if ((itemId % 18) === 17) {
                return showMessages(state);
            }
        });
        this.output('\n');
    }
}

export class Sing extends Action {
    action(state: State): Promise<any> {
        if (chkdumb(state)) {
            throw new Error();
        }
        return sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' sings in Gaelic\n')}`);
    }

    decorate(result: any): void {
        this.output('You sing\n');
    }
}
