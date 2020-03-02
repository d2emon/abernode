import State from './state';
import Action from './action';
import {
    brkword,
} from './__dummies';
import {findVisiblePlayer} from './objsys';
import {showMessages} from './bprintf/output';
import {sendMessage} from './bprintf/bprintf';
import {getString} from "./gamego/input";
import {loadWorld} from "./opensys";
import {sendChangePerson} from "./parse/events";

const getInput = (state: State, message: string, show: boolean): Promise<void> => sendMessage(state, message)
    .then(() => show && showMessages(state));

export class Frobnicate extends Action {
    action(state: State): Promise<any> {
    if (state.my_lev < 10000) {
        throw new Error('No way buster.');
    }
    const name = brkword(state);
    if (!name) {
        throw new Error('Frobnicate who ?');
    }
    return findVisiblePlayer(state, name)
        .then((player) => {
            if (player.isBot && (state.my_lev !== 10033)) {
                throw new Error('Can\'t frob mobiles old bean.');
            }
            if (player.isGod && (state.my_lev !== 10033)) {
                throw new Error(`You can\'t frobnicate ${player.name}!!!!`);
            }
            return showMessages(state)
                .then(() => Promise.all([
                    getInput(state, 'New Level: ', false)
                        .then(() => getString(6)),
                    getInput(state, 'New Score: ', true)
                        .then(() => getString(8)),
                    getInput(state, 'New Strength: ', true)
                        .then(() => getString(8)),
                ]))
                .then(([
                    level,
                    score,
                    strength,
]               ) => loadWorld(state)
                    .then(() => sendChangePerson(state, player, {
                        level,
                        score,
                        strength,
                    }))
                )
                .then(() => true);
        });
    }

    decorate(result: any): void {
        if (result) {
            this.output('Ok....\n');
        }
    }
}
