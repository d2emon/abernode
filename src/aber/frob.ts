import State from './state';
import Action from './action';
import {
    brkword,
    sendsys,
} from './__dummies';
import {findVisiblePlayer} from './objsys';
import {showMessages} from './bprintf/output';
import {sendMessage} from './bprintf/bprintf';

const keysetup = (state: State): void => undefined;
const keysetback = (state: State): void => undefined;
const openworld = (state: State): void => undefined;
const getkbd = (state: State, maxLength: number): string => '';

const getInput = (state: State, message: string, maxLength: number, show: boolean): Promise<string> => sendMessage(state, message)
    .then(() => show && showMessages(state))
    .then(() => getkbd(state, maxLength));

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
                        getInput(state, 'New Level: ', 6, false),
                        getInput(state, 'New Score: ', 8, true),
                        getInput(state, 'New Strength: ', 8, true),
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
