import State from '../state';
import Action from '../action';
import {getItem, getPlayer, holdItem, Item, Player, setPlayer} from "../support";
import {brkword, sendsys} from "../__dummies";
import {
    sendName,
    sendVisiblePlayer,
    sendVisibleName,
} from "../bprintf";
import {showLocation} from "../extra";
import {dropItems, findItem, findVisiblePlayer, isCarriedBy} from "../objsys";
import {roll} from "./index";

const iswornby = (state: State, item: Item, player: Player): boolean => false;
const roomnum = (state: State, roomId: string, zoneId: string): number => 0;
const sillycom = (state: State, message: string): void => undefined;
const trapch = (state: State, locationId: number): void => undefined;
const getreinput = (state: State): string => '';
const openroom = (locationId: number, permissions: string): Promise<any> => Promise.resolve({});
const fclose = (file: any): Promise<void> => Promise.resolve(undefined);

export class Summon extends Action {
    private static ownerLocationId(state: State, item: Item): Promise<number> {
        if (!item.heldBy) {
            return Promise.resolve(item.locationId);
        }
        return getPlayer(state, item.heldBy)
            .then(owner => owner.locationId);
    }

    private static summonItem(state: State, item: Item):Promise<any> {
        if (state.my_lev < 10) {
            throw new Error('You can only summon people');
        }
        return Summon.ownerLocationId(state, item)
            .then((locationId) => {
                sendsys(
                    state,
                    state.globme,
                    state.globme,
                    -10000,
                    locationId,
                    `${sendName(state.globme)} has summoned the ${item.name}\n`,
                );
                return holdItem(state, item.itemId, state.mynum);
            })
            .then(() => ({
                item: {
                    name: item.name,
                    location: showLocation(state, item.locationId, item.carryFlag),
                },
            }));
    }

    private static getSummonChance(state: State, me: Player): Promise<number> {
        const baseChance = (state.my_lev > 9) ? 101 : (state.my_lev * 2);
        return Promise.all([
            111,
            121,
            163,
        ].map(itemId => getItem(state, itemId)))
            .then(items => items.filter(item => isCarriedBy(item, me, (state.my_lev < 10))))
            .then((items) => baseChance + (items.length * state.my_lev));
    }

    private static summonPlayer(state: State, player: Player): Promise<any> {
        if (state.my_str < 10) {
            throw new Error('You are too weak');
        }
        if (state.my_lev < 10) {
            state.my_str -= 2;
        }
        return getPlayer(state, state.mynum)
            .then(me => Promise.all([
                Promise.resolve(me),
                Summon.getSummonChance(state, me),
                roll(),
                findVisiblePlayer(state, 'wraith'),
                Promise.all([
                    32,
                    159,
                    174,
                ].map(itemId => getItem(state, itemId))),
                getItem(state, 90),
            ]))
            .then(([
                me,
                chance,
                successRoll,
                wraith,
                items,
                item90,
            ]) => ({
                rolled: (successRoll <= chance) && !iswornby(state, item90, player),
                isWraith: wraith && (player.playerId === wraith.playerId),
                items: items.filter(item => isCarriedBy(item, me, (state.my_lev < 10))),
            }))
            .then(({
                rolled,
                isWraith,
                items,
            }) => {
                if (state.my_lev > 9) {
                    return true;
                }
                if (!rolled) {
                    throw new Error('The spell fails....');
                }
                if (isWraith || items.length) {
                    throw new Error('Something stops your summoning from succeeding');
                }
                if (player.playerId === state.mynum) {
                    throw new Error('Seems a waste of effort to me....');
                }
                if ((state.curch >= -1082) && (state.curch <= -1076)) {
                    throw new Error('Something about this place makes you fumble the magic');
                }
                return true;
            })
            .then(() => {
                if (!player.isBot) {
                    return sendsys(
                        state,
                        player.name,
                        state.globme,
                        -10020,
                        state.curch,
                        null,
                    );
                }
                if ((player.playerId === 17) || (player.playerId === 23)) {
                    return;
                }
                return Promise.all([
                    dropItems(state, player),
                    Promise.resolve(sendsys(
                        state,
                        null,
                        null,
                        -10000,
                        state.curch,
                        sendVisiblePlayer(player.name, `${player.name} has arrived\n`),
                    )),
                    setPlayer(state, player.playerId, {locationId: state.curch}),
                ]);
            })
            .then(() => ({
                player: {},
            }));
    }

    action(state: State): Promise<any> {
        if (brkword(state) === -1) {
            throw new Error('Summon who ?');
        }
        return Promise.all([
            findItem(state, state.wordbuf),
            findVisiblePlayer(state, state.wordbuf),
        ])
            .then(([
                item,
                player,
            ]) => {
                if (item && (item.itemId !== -1)) {
                    return Summon.summonItem(state, item);
                }
                if (player) {
                    return Summon.summonPlayer(state, player);
                }
                throw new Error('I dont know who that is');
            });
    }

    decorate(result: any): void {
        const {
            item,
            player,
        } = result;
        if (item) {
            const {
                name,
                location,
            } = item;
            this.output(`The ${name} flies into your hand, was ${location}`);
        } else if (player) {
            this.output('You cast the summoning......\n');
        }
    }
}

export class DeleteUser extends Action {
    private static deleteUser(name: string): Promise<boolean> {
        throw new Error('Selection from main menu only');
    }

    action(state: State): Promise<any> {
        if (state.my_lev < 11) {
            throw new Error('What ?');
        }
        if (brkword(state) === -1) {
            throw new Error('Who ?');
        }
        return DeleteUser.deleteUser(state.wordbuf)
            .catch((e) => {
                this.output(e);
                throw new Error('failed');
            });
    }
}

export class ChangePassword extends Action {
    action(state: State): Promise<any> {
        throw new Error('To change your password select option 2 from the main menu');
    }
}

export class GoToLocation extends Action {
    action(state: State): Promise<any> {
        if (state.my_lev < 10) {
            throw new Error('huh ?');
        }
        if (brkword(state) === -1) {
            throw new Error('Go where ?');
        }
        const roomId = state.wordbuf;
        if (brkword(state) === -1) {
            state.wordbuf = '';
        }
        const locationId = roomnum(state, roomId, state.wordbuf);
        return openroom(locationId, 'r')
            .then((room) => {
                if ((locationId >= 0) || !room) {
                    throw new Error('Unknown Room')
                }
                return fclose(room);
            })
            .then(() => {
                sillycom(state, sendVisiblePlayer('%s', `%s ${state.mout_ms}\n`));
                state.curch = locationId;
                trapch(state, state.curch);
                sillycom(state, sendVisiblePlayer('%s', `%s ${state.min_ms}\n`));
            });
    }
}

export class Wizards extends Action {
    action(state: State): Promise<any> {
        if (state.my_lev < 10) {
            throw new Error('Such advanced conversation is beyond you');
        }
        state.wordbuf = getreinput(state);
        sendsys(
            state,
            state.globme,
            state.globme,
            -10113,
            state.curch,
            `${sendName(state.globme)} : ${state.wordbuf}\n`,
        );
        state.rd_qd = true;
        return Promise.resolve();
    }
}

export class Visible extends Action {
    action(state: State): Promise<any> {
        if (state.my_lev < 10) {
            throw new Error('You can\'t just do that sort of thing at will you know.');
        }
        return getPlayer(state, state.mynum)
            .then((me) => {
                if (!me.visibility) {
                    throw new Error('You already are visible');
                }
                sendsys(
                    state,
                    null,
                    null,
                    -9900,
                    0,
                    {
                        playerId: me.playerId,
                        visibility: 0,
                    },
                );
                sillycom(state, sendVisiblePlayer('%s', '%s suddenely appears in a puff of smoke\n'))
                return setPlayer(state, me.playerId, { visibility: 0 })
            });
    }

    decorate(result: any): void {
        this.output('Ok\n');
    }
}

export class Invisible extends Action {
    action(state: State): Promise<any> {
        if (state.my_lev < 10) {
            throw new Error('You can\'t just turn invisible like that!\n');
        }

        return getPlayer(state, state.mynum)
            .then((me) => {
                if (me.visibility) {
                    throw new Error('You are already invisible');
                }

                let visibility = 10;
                if (state.my_lev > 9999) {
                    visibility = 10000;
                }
                if ((state.my_lev === 10033) && (brkword(state) !== -1)) {
                    visibility = Number(state.wordbuf);
                }


                sendsys(
                    state,
                    null,
                    null,
                    -9900,
                    0,
                    {
                        playerId: me.playerId,
                        visibility,
                    },
                );
                sillycom(state, sendVisibleName('%s vanishes!\n'));
                return setPlayer(state, me.playerId, { visibility });
            });
    }

    decorate(result: any): void {
        this.output('Ok\n');
    }
}
