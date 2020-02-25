import State from './state';
import Action from './action';
import {
    brkword,
    sendsys,
} from './__dummies';
import {findVisiblePlayer} from './objsys';
import {showMessages} from './bprintf/output';
import {sendMessage} from './bprintf/bprintf';
import {getString} from "./gamego/input";

const keysetup = (state: State): void => undefined;
const keysetback = (state: State): void => undefined;
const openworld = (state: State): void => undefined;

const getInput = (state: State, message: string, show: boolean): Promise<void> => sendMessage(state, message)
    .then(() => show && showMessages(state));

export class Frobnicate extends Action {
    action(state: State): Promise<any> {
    if (state.my_lev < 10000) {
        throw new Error('No way buster.');
    }
    if (brkword(state) === -1) {
        throw new Error('Frobnicate who ?');
    }
    return findVisiblePlayer(state, state.wordbuf)
        .then((player) => {
            if (player.isBot && (state.my_lev !== 10033)) {
                throw new Error('Can\'t frob mobiles old bean.');
            }
            if (player.isGod && (state.my_lev !== 10033)) {
                throw new Error(`You can\'t frobnicate ${player.name}!!!!`);
            }
            return showMessages(state)
                .then(() => {
                    keysetback(state);
                    return Promise.all([
                        getInput(state, 'New Level: ', false)
                            .then(() => getString(6)),
                        getInput(state, 'New Score: ', true)
                            .then(() => getString(8)),
                        getInput(state, 'New Strength: ', true)
                            .then(() => getString(8)),
                    ]);
                })
                .then((values) => {
                    keysetup(state);
                    openworld(state);
                    sendsys(
                        state,
                        player.name,
                        player.name,
                        -599,
                        0,
                        values,
                    );
                    return true;
                });
        });
    }

    decorate(result: any): void {
        if (result) {
            this.output('Ok....\n');
        }
    }
}
