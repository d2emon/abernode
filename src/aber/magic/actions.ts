import State from '../state';
import Action from '../action';
import {
    sendName,
    sendVisiblePlayer,
    sendVisibleName,
} from '../bprintf';
import {showLocation} from '../extra';
import {
    dropItems,
    findItem,
    findVisiblePlayer,
    isCarriedBy,
} from '../objsys';
import {
    Item,
    Player,
    createItem,
    getItem,
    getPlayer,
    holdItem,
    putItem,
    setPlayer,
} from '../support';
import {roll} from "./index";
import {sendWizards} from "../new1/events";
import {isWornBy} from "../new1";
import {getLevel, getStrength, isAdmin, isGod, isWizard, updateStrength} from "../newuaf/reducer";
import {getLocationId, getName, playerIsMe} from "../tk/reducer";
import {setLocationId} from '../tk';
import Events from "../tk/events";
import {sendSocialEvent} from "../weather/events";
import {getLocationIdByZone} from "../zones";

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

    private static summonItem(state: State, actor: Player, item: Item):Promise<any> {
        if (!isWizard(state)) {
            throw new Error('You can only summon people');
        }
        return Summon.ownerLocationId(state, item)
            .then(locationId => Events.sendLocalMessage(state, locationId, getName(state), `${sendName(getName(state))} has summoned the ${item.name}\n`))
            .then(() => holdItem(state, item.itemId, actor.playerId))
            .then(() => ({
                item: {
                    name: item.name,
                    location: showLocation(state, item.locationId, item.carryFlag),
                },
            }))
    }

    private static getSummonChance(state: State, me: Player): Promise<number> {
        const baseChance = isWizard(state) ? 101 : (getLevel(state) * 2);
        return Promise.all([
            111,
            121,
            163,
        ].map(itemId => getItem(state, itemId)))
            .then(items => items.filter(item => isCarriedBy(item, me, !isWizard(state))))
            .then((items) => baseChance + (items.length * getLevel(state)));
    }

    private static summonPlayer(state: State, actor: Player, player: Player): Promise<any> {
        if (getStrength(state) < 10) {
            throw new Error('You are too weak');
        }
        if (!isWizard(state)) {
            updateStrength(state, -2);
        }
        return Promise.all([
            Summon.getSummonChance(state, actor),
            roll(),
            findVisiblePlayer(state, 'wraith'),
            Promise.all([
                32,
                159,
                174,
            ].map(itemId => getItem(state, itemId))),
            getItem(state, 90),
        ])
            .then(([
                chance,
                successRoll,
                wraith,
                items,
                item90,
            ]) => ({
                rolled: (successRoll <= chance) && !isWornBy(state, item90, player),
                isWraith: wraith && (player.playerId === wraith.playerId),
                items: items.filter(item => isCarriedBy(item, actor, !isWizard(state))),
            }))
            .then(({
                rolled,
                isWraith,
                items,
            }) => {
                if (isWizard(state)) {
                    return true;
                }
                if (!rolled) {
                    throw new Error('The spell fails....');
                }
                if (isWraith || items.length) {
                    throw new Error('Something stops your summoning from succeeding');
                }
                if (playerIsMe(state, player.playerId)) {
                    throw new Error('Seems a waste of effort to me....');
                }
                if ((getLocationId(state) >= -1082) && (getLocationId(state) <= -1076)) {
                    throw new Error('Something about this place makes you fumble the magic');
                }
                return true;
            })
            .then(() => {
                if (!player.isBot) {
                    return Events.sendSummon(state, player, getName(state), getLocationId(state));
                }
                if ((player.playerId === 17) || (player.playerId === 23)) {
                    return;
                }
                return Promise.all([
                    dropItems(state, player),
                    Events.sendLocalMessage(state, getLocationId(state), undefined, sendVisiblePlayer(player.name, `${player.name} has arrived\n`)),
                    setPlayer(state, player.playerId, { locationId: getLocationId(state) }),
                ])
                    .then(() => {});
            })
            .then(() => ({
                player: {},
            }));
    }

    action(state: State, actor: Player): Promise<any> {
        return Action.nextWord(state, 'Summon who ?')
            .then(name => Promise.all([
                findItem(state, name, actor),
                findVisiblePlayer(state, name),
            ]))
            .then(([
                item,
                player,
            ]) => {
                if (item) {
                    return Summon.summonItem(state, actor, item);
                }
                if (player) {
                    return Summon.summonPlayer(state, actor, player);
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
        if (getLevel(state) < 11) {
            throw new Error('What ?');
        }
        return Action.nextWord(state, 'Who ?')
            .then(name => DeleteUser.deleteUser(name))
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
    action(state: State, actor: Player): Promise<any> {
        if (!isWizard(state)) {
            throw new Error('huh ?');
        }
        return Action.nextWord(state, 'Go where ?')
            .then(zoneName => Promise.all([
                Promise.resolve(zoneName),
                Action.nextWord(state),
            ]))
            .then(([
                zoneName,
                roomId,
            ]) => {
                const locationId = getLocationIdByZone(state, zoneName, Number(roomId));
                return Promise.all([
                    Promise.resolve(locationId),
                    openroom(locationId, 'r'),
                ])
            })
            .then(([
                locationId,
                room,
            ]) => {
                if ((locationId >= 0) || !room) {
                    throw new Error('Unknown Room')
                }
                return fclose(room).then(() => locationId);
            })
            .then((locationId) => Promise.all([
                sendSocialEvent(state, sendVisiblePlayer('%s', `%s ${state.mout_ms}\n`)),
                setLocationId(state, locationId, actor),
                sendSocialEvent(state, sendVisiblePlayer('%s', `%s ${state.min_ms}\n`)),
            ]));
    }
}

export class Wizards extends Action {
    action(state: State): Promise<any> {
        if (!isWizard(state)) {
            throw new Error('Such advanced conversation is beyond you');
        }
        const message = getreinput(state);
        return sendWizards(state, `${sendName(getName(state))} : ${message}\n`, true);
    }
}

export class Visible extends Action {
    action(state: State, actor: Player): Promise<any> {
        if (!isWizard(state)) {
            throw new Error('You can\'t just do that sort of thing at will you know.');
        }
        if (!actor.visibility) {
            throw new Error('You already are visible');
        }
        return Promise.all([
            Events.sendVisibility(state, {
                playerId: actor.playerId,
                visibility: 0,
            }),
            sendSocialEvent(state, sendVisiblePlayer('%s', '%s suddenely appears in a puff of smoke\n')),
            setPlayer(state, actor.playerId, {visibility: 0}),
        ])
            .then(() => {
            });
    }

    decorate(result: any): void {
        this.output('Ok\n');
    }
}

export class Invisible extends Action {
    action(state: State, actor: Player): Promise<any> {
        if (!isWizard(state)) {
            throw new Error('You can\'t just turn invisible like that!\n');
        }
        if (actor.visibility) {
            throw new Error('You are already invisible');
        }

        return Action.nextWord(state)
            .then((value) => {
                if (isGod(state)) {
                    return 10000;
                } else if (isAdmin(state) && value) {
                    return Number(value);
                } else {
                    return 10;
                }
            })
            .then(visibility => Promise.all([
                Events.sendVisibility(state, {
                    playerId: actor.playerId,
                    visibility,
                }),
                sendSocialEvent(state, sendVisibleName('%s vanishes!\n')),
                setPlayer(state, actor.playerId, { visibility }),
            ]))
            .then(() => {});
    }

    decorate(result: any): void {
        this.output('Ok\n');
    }
}

export class Ressurect extends Action {
    action(state: State, actor: Player): Promise<any> {
        if (!isWizard(state)) {
            throw new Error('Huh ?');
        }
        return Action.nextWord(state, 'Yes but what ?')
            .then(name => findItem(state, name, actor))
            .then((item) => {
                if (!item) {
                    throw new Error('You can only ressurect objects');
                }
                if (!item.isDestroyed) {
                    throw new Error('That already exists');
                }
                return createItem(state, item.itemId);
            })
            .then((item) => Promise.all([
                Events.sendLocalMessage(state, getLocationId(state), undefined, `The ${item.name} suddenly appears`),
                putItem(state, item.itemId, getLocationId(state)),
            ]));
    }
}
