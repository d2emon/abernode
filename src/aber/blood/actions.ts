import Action from '../action';
import State from '../state';
import {brkword} from '../__dummies';
import {
    getPlayer,
    Item,
    Player,
} from '../support';
import {
    findAvailableItem,
    findCarriedItem,
    findVisiblePlayer,
} from '../objsys';
import {
    getWeapon,
    setWeapon,
} from './reducer';
import {
    damageByItem,
    hitPlayer,
} from './index';

const calibme = (state: State): void => undefined;
const sys_reset = (state: State): void => undefined;

export class Weapon extends Action {
    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            throw new Error('Which weapon do you wish to select though');
        }
        return getPlayer(state, state.mynum)
            .then(player => findCarriedItem(state, state.wordbuf, player))
            .then((item) => {
                if (!item) {
                    throw new Error('Whats one of those ?');
                }
                const weapon = (damageByItem(item) !== undefined) ? item : undefined;
                setWeapon(state, weapon);
                if (!weapon) {
                    throw new Error('Thats not a weapon');
                }
                calibme(state);
            });
    }

    decorate(result: any): void {
        this.output('OK...\n');
    }
}

export class Kill extends Action {
    getVictim(state: State): Promise<Player> {
        return findVisiblePlayer(state, state.wordbuf)
            .then((player) => {
                if (!player) {
                    throw new Error('You can\'t do that');
                }
                if (player.playerId === state.mynum) {
                    throw new Error('Come on, it will look better tomorrow...');
                }
                if (player.locationId !== state.curch) {
                    throw new Error('They aren\'t here');
                }
                return player;
            });
    }

    getWeapon(state: State): Promise<Item> {
        if (brkword(state) === -1) {
            return getWeapon(state);
        }
        if (state.wordbuf !== 'with') {
            return this.getWeapon(state);
        }
        if (brkword(state) === -1) {
            throw new Error('with what ?\n');
        }
        return getPlayer(state, state.mynum)
            .then(me => findCarriedItem(state, state.wordbuf, me))
            .then((weapon) => {
                if (!weapon) {
                    throw new Error('with what ?\n');
                }
                return weapon;
            });
    }

    breakItem(state: State, item?: Item): Promise<any> {
        if (!item) {
            throw new Error('What is that ?');
        }
        if (item.itemId === 171) {
            sys_reset(state);
            return;
        }
        throw new Error('You can\'t do that');
    }

    killPlayer(state: State): Promise<any> {
        return Promise.all([
            this.getVictim(state),
            this.getWeapon(state),
        ])
            .then(([player, weapon]) => {
                return hitPlayer(state, player, weapon);
            });
    };

    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            throw new Error('Kill who');
        }
        if (state.wordbuf === 'door') {
            throw new Error('Who do you think you are , Moog?');
        }
        return findAvailableItem(state, state.wordbuf)
            .then((item) => (
                item
                    ? this.breakItem(state, item)
                    : this.killPlayer(state)
            ));
    }
}
