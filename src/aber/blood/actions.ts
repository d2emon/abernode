import Action from '../action';
import State from '../state';
import {brkword} from '../__dummies';
import {
    getPlayer,
    Item,
    Player, scale,
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
import {RESET_N} from "../files";

const calibme = (state: State): void => undefined;
const rescom = (state: State): Promise<any> => Promise.resolve({});
const time = (state: State): number => 0;

const openlock = (filename: string, permissions: string): Promise<any> => Promise.resolve({});
const fscanf = (file: any, template: string): Promise<any> => Promise.resolve(0);
const fclose = (file: any): Promise<void> => Promise.resolve();

const sysReset = (state: State): Promise<void> => {
    const doReset = (level: number): Promise<void> => {
        state.my_lev = 10;
        return rescom(state)
            .then(() => {
                state.my_lev = level;
            });
    };

    if (scale(state) !== 2) {
        throw new Error('There are other people on.... So it wont work!');
    }
    return openlock(RESET_N, 'ruf')
        .then(fl => Promise.all([
            Promise.resolve(fl),
            fscanf(fl, '%ld'),
        ]))
        .then(([fl, u]) => fclose(fl).then(() => u))
        .then((u) => {
            const t = time(state);
            if (t < u) {
                return false;
            }
            return (t - u) >= 3600;
        })
        .catch(() => true)
        .then((canReset) => {
            if (!canReset) {
                throw new Error('Sorry at least an hour must pass between resets');
            }
            return doReset(state.my_lev);
        });
};

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
            return sysReset(state);
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
