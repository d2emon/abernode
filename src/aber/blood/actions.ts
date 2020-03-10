import Action from '../action';
import State from '../state';
import {
    getPlayer,
    Item,
    Player,
    scale,
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
import {getLevel, setLevel} from "../newuaf/reducer";
import {isHere, playerIsMe} from "../tk/reducer";
import {calibrate} from "../parse";
import {Reset} from "../parse/actions";

const openlock = (filename: string, permissions: string): Promise<any> => Promise.resolve({});
const fscanf = (file: any, template: string): Promise<any> => Promise.resolve(0);
const fclose = (file: any): Promise<void> => Promise.resolve();

const sysReset = (state: State, actor: Player): Promise<void> => {
    const doReset = (level: number): Promise<void> => {
        setLevel(state, 10);
        const action = new Reset()
        return action.perform(state, actor)
            .then(() => setLevel(state, level));
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
            const t = new Date();
            if (t.getTime() < u) {
                return false;
            }
            return (t.getTime() - u) >= 3600;
        })
        .catch(() => true)
        .then((canReset) => {
            if (!canReset) {
                throw new Error('Sorry at least an hour must pass between resets');
            }
            return doReset(getLevel(state));
        });
};

export class Weapon extends Action {
    action(state: State, actor: Player): Promise<any> {
        return Action.nextWord(state)
            .catch(() => Promise.reject(new Error('Which weapon do you wish to select though')))
            .then(name => findCarriedItem(state, name, actor))
            .then((item) => {
                if (!item) {
                    throw new Error('Whats one of those ?');
                }
                const weapon = (damageByItem(item) !== undefined) ? item : undefined;
                setWeapon(state, weapon);
                if (!weapon) {
                    throw new Error('Thats not a weapon');
                }
            })
            .then(() => calibrate(state, actor));
    }

    decorate(result: any): void {
        this.output('OK...\n');
    }
}

export class Kill extends Action {
    getVictim(state: State, player: Player): Promise<Player> {
        if (!player) {
            throw new Error('You can\'t do that');
        }
        if (playerIsMe(state, player.playerId)) {
            throw new Error('Come on, it will look better tomorrow...');
        }
        if (!isHere(state, player.locationId)) {
            throw new Error('They aren\'t here');
        }
        return Promise.resolve(player);
    }

    getWeapon(state: State, actor: Player): Promise<Item> {
        return Action.nextWord(state)
            .then((name) => findCarriedItem(state, name, actor))
            .then((weapon) => {
                if (!weapon) {
                    throw new Error('with what ?\n');
                }
                return weapon;
            });
    }

    breakItem(state: State, actor: Player, item?: Item): Promise<any> {
        if (!item) {
            throw new Error('What is that ?');
        }
        if (item.itemId === 171) {
            return sysReset(state, actor);
        }
        throw new Error('You can\'t do that');
    }

    killPlayer(state: State, actor: Player, player: Player): Promise<any> {
        return Promise.all([
            this.getVictim(state, player),
            this.getWeapon(state, actor),
        ])
            .then(([player, weapon]) => hitPlayer(state, actor, player, weapon));
    };

    action(state: State, actor: Player): Promise<any> {
        return Action.nextWord(state)
            .catch(() => Promise.reject(new Error('Kill who')))
            .then((name) => {
                if (name === 'door') {
                    throw new Error('Who do you think you are , Moog?');
                }
                return Promise.all([
                    findAvailableItem(state, name, actor),
                    findVisiblePlayer(state, name),
                ]);
            })
            .then(([
                item,
                player,
            ]) => (
                item
                    ? this.breakItem(state, actor, item as Item)
                    : this.killPlayer(state, actor, player as Player)
            ));
    }
}
