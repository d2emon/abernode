import Action from "../action";
import State from "../state";
import {
    createItem,
    getHelper,
    getItem,
    getPlayer,
    getPlayers,
    holdItem,
    Item,
    Player,
    putItem,
    setItem
} from "../support";
import {brkword, sendsys} from "../__dummies";
import {getDragon} from "../mobile";
import {sendPlayerForVisible, sendVisibleName} from "../bprintf";
import {getLevel, isWizard, updateScore} from "../newuaf/reducer";
import {HELD_BY} from "../object";
import {
    findAvailableItem,
    findCarriedItem,
    findContainedItem,
    findHereItem,
    itemsAt,
    SHIELD_BASE_ID,
    SHIELD_IDS
} from "./index";
import {sendMessage} from "../bprintf/bprintf";

const calibme = (state: State): boolean => false;
const cancarry = (state: State, playerId: number): boolean => false;

const itemsCarriedBy = (state: State, player: Player): Promise<void> => itemsAt(state, player.playerId, HELD_BY)
    .then((result) => sendMessage(state, result));

export class Inventory extends Action {
    action(state: State): Promise<any> {
        return getPlayer(state, state.mynum)
            .then((player) => itemsCarriedBy(state, player));
    }

    decorate(result: any): void {
        this.output( 'You are carrying\n');
        this.output(result);
    }
}

export class GetItem extends Action {
    fromContainer(state: State, name:string): Promise<Item[]> {
        if (brkword(state) === -1) {
            return Promise.reject(new Error('From what ?'));
        }
        return findAvailableItem(state, state.wordbuf)
            .then((container) => {
                if (!container) {
                    return Promise.reject(new Error('You can\'t take things from that - it\'s not here'));
                }
                return Promise.all([
                    findContainedItem(state, name, container),
                    Promise.resolve(container),
                ])
            });
    }

    getShield(state: State): Promise<Item> {
        return Promise.all(SHIELD_IDS.map(shieldId => getItem(state, shieldId)))
            .then(shields => shields.find(shield => shield.isDestroyed))
            .then((shield) => {
                if (!shield) {
                    return Promise.reject(new Error('The shields are all to firmly secured to the walls'));
                }
                return createItem(state, shield.itemId);
            })
    }

    getRuneSword(state: State, item: Item): Promise<Item> {
        return getPlayer(state, state.mynum)
            .then(getHelper(state))
            .then((helper) => {
                if ((item.state === 1) && !helper) {
                    throw new Error('Its too well embedded to shift alone.\n');
                }
            })
            .then(() => item);

    }

    private static checkDragon(state: State): Promise<boolean> {
        return getDragon(state)
            .then((isDragon) => {
                if (isDragon) {
                    return Promise.reject();
                }
                return true;
            })
    }

    private static checkCarry(state: State): Promise<boolean> {
        if (!cancarry(state, state.mynum)) {
            return Promise.reject(new Error('You can\'t carry any more'));
        }
        return Promise.resolve(true);
    }

    private checkCanGet(state: State, item: Item): Promise<Item> {
        if (item.flannel) {
            throw new Error('You can\'t take that!');
        }
        return Promise.all([
            GetItem.checkDragon(state),
            GetItem.checkCarry(state),
        ])
            .then(() => (item.itemId === 32) ? this.getRuneSword(state, item) : item);
    }

    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            return Promise.reject(new Error('Get what ?'));
        }
        const stp = state.stp;
        const name = state.wordbuf;
        return findHereItem(state, name)
            .then((item: Item) => {
                /* Hold */
                if (brkword(state) === -1) {
                    return [item, undefined];
                }
                if ((state.wordbuf !== 'from') && (state.wordbuf !== 'out')) {
                    return [item, undefined];
                }
                return this.fromContainer(state, name);
            })
            .then(([item, container]) => {
                state.stp = stp;
                if (!item) {
                    return Promise.reject(new Error('That is not here.'));
                }
                return (!container && (item.itemId === SHIELD_BASE_ID)) ? this.getShield(state) : item;
            })
            .then(item => this.checkCanGet(state, item))
            .then((item) => {
                const results = [
                    holdItem(state, item.itemId, state.mynum),
                    new Promise((resolve) => {
                        sendsys(
                            state,
                            state.globme,
                            state.globme,
                            -10000,
                            state.curch,
                            `${sendPlayerForVisible(state.globme)}${sendVisibleName(` takes the ${item.name}\n`)}`,
                        );
                        return resolve();
                    })
                ];
                const messages = [];
                if (item.changeStateOnTake) {
                    results.push(setItem(state, item.itemId, { state: 0 }));
                }
                if (state.curch === -1081) {
                    messages.push('The door clicks shut....\n');
                    results.push(setItem(state, 20, { state: 1 }));
                }
                return Promise.all(results).then(() => ({
                    messages,
                }));
            });
    }

    decorate(result: any): void {
        const {
            messages,
        } = result;
        this.output('Ok...\n');
        messages.forEach(message => this.output(`${message}\n`));
    }
}

export class DropItem extends Action {
    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            return Promise.reject(new Error('Drop what ?'));
        }
        return getPlayer(state, state.mynum)
            .then(player => findCarriedItem(state, state.wordbuf, player))
            .then((item) => {
                if (!item) {
                    return Promise.reject(new Error('You are not carrying that.'));
                }
                if ((item.itemId === 32) && !isWizard(state)) {
                    return Promise.reject(new Error('You can\'t let go of it!'));
                }
                return Promise.all([
                    putItem(state, item.itemId, state.curch),
                    new Promise((resolve) => {
                        sendsys(
                            state,
                            state.globme,
                            state.globme,
                            -10000,
                            state.curch,
                            `${sendPlayerForVisible(state.globme)}${sendVisibleName(` drops the ${item.name}\n`)}`,
                        );
                        return resolve();
                    })
                ]).then(() => item)
            })
            .then((item) => {
                if (state.curch !== -183) {
                    return {
                        messages: [],
                    };
                }

                return Promise.all([
                    new Promise((resolve) => {
                        sendsys(
                            state,
                            state.globme,
                            state.globme,
                            -10000,
                            state.curch,
                            `The ${state.wordbuf} disappears into the bottomless pit.\n`,
                        );
                        return resolve();
                    }),
                    new Promise((resolve) => {
                        updateScore(state, item.value);
                        calibme(state);
                        return resolve();
                    }),
                    putItem(state, item.itemId, -6),
                ])
                    .then(() => ({
                        messages: [
                            'It disappears down into the bottomless pit.....\n',
                        ],
                    }));
            });
    }

    decorate(result: any): void {
        const {
            messages,
        } = result;
        this.output('OK..\n');
        messages.forEach(message => this.output(`${message}\n`));
    }
}

class Who extends Action {
    describePlayer(state: State, player: Player): string {
        if (player.isDead) {
            /* On  Non game mode */
            return;
        }
        if (player.visibility > getLevel(state)) {
            return;
        }
        let result = `${player.name}${player.title}`;
        if (player.visibility) {
            result = `(${result})`;
        }
        return `${result}${player.isAbsent ? ' [Absent From Reality]' : ''}`;
    }

    action(state: State): Promise<any> {
        const maxPlayerId = isWizard(state) ? 0 : state.maxu;
        const players = [];
        const mobiles = [];
        return getPlayers(state, maxPlayerId)
            .then(p => p.filter(player => player.exists))
            .then(p => p.forEach((player) => {
                const description = this.describePlayer(state, player);
                if (!description) {
                    return;
                }
                if (player.playerId < state.maxu) {
                    players.push(description);
                } else {
                    mobiles.push(description);
                }
            }))
            .then(() => ({
                players,
                mobiles,
            }));
    }

    decorate(result: any): void {
        const {
            players,
            mobiles
        } = result;
        if (players.length) {
            this.output('Players\n');
            players.forEach(player => this.output(player))
        }
        if (mobiles.length) {
            if (players.length) {
                this.output('----------\n');
            }
            this.output('Mobiles\n');
            mobiles.forEach(player => this.output(player))
        }
        this.output('\n');
    }
}

class UserCom extends Who {
    getLevel(state: State): number {
        return 0;
    }
}
