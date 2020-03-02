import Action from '../action';
import State from '../state';
import {
    brkword,
} from "../__dummies";
import {
    sendSound,
    sendSoundPlayer,
} from "../bprintf";
import {findAvailableItem} from "../objsys";
import {getItems} from "../support";
import {showMessages} from "../bprintf/output";
import {getAvailablePlayer} from "../new1/actions";
import {checkDumb} from "../new1/reducer";
import {isWizard} from "../newuaf/reducer";
import {sendEvil} from "../parse/events";

const rescom = (state: State): Promise<any> => Promise.resolve({});
const sillycom = (state: State, message: string): Promise<any> => Promise.resolve({});
const findzone = (state: State, locationId: number): number[] => [0, 0];

export class Crash extends Action {
    action(state: State): Promise<any> {
        if (!isWizard(state)) {
            throw new Error('Hmmm....\nI expect it will sometime');
        }
        return Promise.all([
            sendEvil(state),
            rescom(state),
        ]);
    }

    decorate(result: any): void {
        this.output('Bye Bye Cruel World...\n');
    }
}

export class Sing extends Action {
    action(state: State): Promise<any> {
        return Promise.all([
            checkDumb(state),
            sillycom(state, `${sendSoundPlayer('%s')}${sendSound(' sings in Gaelic\n')}`),
        ]);
    }

    decorate(result: any): void {
        this.output('You sing\n');
    }
}

export class Spray extends Action {
    action(state: State): Promise<any> {
        return getAvailablePlayer(state)
            .then((player) => {
                let name = brkword(state);
                if (!name) {
                    throw new Error('With what ?');
                }
                if (name === 'with') {
                    name = brkword(state);
                    if (!name) {
                        throw new Error('With what ?');
                    }
                }
                return findAvailableItem(state, name);
            })
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
        if (!isWizard(state)) {
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
