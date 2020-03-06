import Action from '../action';
import State from '../state';
import Events from "../tk/events";
import {
    sendSound,
    sendSoundPlayer,
} from "../bprintf";
import {findAvailableItem} from "../objsys";
import {getItems, Item, Player} from "../support";
import {sendAndShow, showMessages} from "../bprintf/output";
import {getAvailablePlayer} from "../new1/actions";
import {checkDumb} from "../new1/reducer";
import {isWizard} from "../newuaf/reducer";

const rescom = (state: State): Promise<any> => Promise.resolve({});
const sillycom = (state: State, message: string): Promise<any> => Promise.resolve({});
const findzone = (state: State, locationId: number): number[] => [0, 0];

export class Crash extends Action {
    check(state: State, actor: Player): Promise<void> {
        if (!isWizard(state)) {
            return Promise.reject(new Error('Hmmm....\nI expect it will sometime'));
        }
        return Promise.resolve();
    }

    action(state: State): Promise<any> {
        return Promise.all([
            Events.sendEvil(state),
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
    action(state: State, actor: Player): Promise<any> {
        const getWithItem = (): Promise<Item> => Action.nextWord(state, 'With what ?')
            .then((name) => ((name === 'with')
                ? Action.nextWord(state, 'With what ?')
                : name
            ))
            .then(name => findAvailableItem(state, name, actor))
            .then(item => item || Promise.reject(new Error('With what ?')));
        return getAvailablePlayer(state)
            .then(player => Promise.all([
                getWithItem(),
                Promise.resolve(player),
            ]))
            .then(() => Promise.reject(new Error('You can\'t do that')));
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
            const message = ((itemId % 3) === 2) ? `${item}\n` : item;
            if ((itemId % 18) === 17) {
                return sendAndShow(state, message);
            } else {
                this.output(message);
            }
        });
        this.output('\n');
    }
}
