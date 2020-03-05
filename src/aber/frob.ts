import State from './state';
import Action from './action';
import {findVisiblePlayer} from './objsys';
import {sendAndShow, showMessages} from './bprintf/output';
import {sendMessage} from './bprintf/bprintf';
import {getString} from "./gamego/input";
import {loadWorld} from "./opensys";
import {sendChangePerson} from "./parse/events";

export class Frobnicate extends Action {
    action(state: State): Promise<any> {
        if (state.my_lev < 10000) {
            throw new Error('No way buster.');
        }
        return Action.nextWord(state, 'Frobnicate who ?')
            .then(name => findVisiblePlayer(state, name))
            .then((player) => {
                if (player.isBot && (state.my_lev !== 10033)) {
                    throw new Error('Can\'t frob mobiles old bean.');
                }
                if (player.isGod && (state.my_lev !== 10033)) {
                    throw new Error(`You can\'t frobnicate ${player.name}!!!!`);
                }
                return showMessages(state)
                    .then(() => Promise.all([
                        sendAndShow(state, 'New Level: ')
                            .then(() => getString(6)),
                        sendAndShow(state, 'New Score: ')
                            .then(() => getString(8)),
                        sendAndShow(state, 'New Strength: ')
                            .then(() => getString(8)),
                    ]))
                    .then(([
                        level,
                        score,
                        strength,
    ]               ) => loadWorld(state)
                        .then(newState => sendChangePerson(state, player, {
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
