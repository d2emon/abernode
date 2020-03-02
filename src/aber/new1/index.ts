import State from "../state";
import {
    brkword,
} from "../__dummies";
import {
    dropItems,
    findAvailableItem,
    isCarriedBy,
} from "../objsys";
import {
    Item,
    Player,
    getItem,
    getPlayer,
    setPlayer,
} from "../support";
import {sendWizards} from "./events";
import {roll} from "../magic";
import {sendVisiblePlayer} from "../bprintf";
import {getLevel, isWizard} from "../newuaf/reducer";
import {loadWorld} from "../opensys";
import {sendDamage, sendLocalMessage} from "../parse/events";

const trapch = (state: State, locationId: number): void => undefined;

/**
 * Extensions section 1
 */

/* Door is 6 panel 49 */

export const getAvailableItem = (state: State): Promise<Item> => {
    if (brkword(state) === -1) {
        throw new Error('Tell me more ?');
    }
    return loadWorld(state)
        .then(() => findAvailableItem(state, state.wordbuf))
        .then((item) => {
            if (!item) {
                throw new Error('There isn\'t one of those here');
            }
            return item;
        })
};

export const isWornBy = (state: State, item: Item, player: Player): boolean => {
    if (!isCarriedBy(item, player, !isWizard(state))) {
        return false;
    }
    if (item.heldBy === undefined) {
        return false;
    }
    return true;
};


export const setPlayerDamage = (state: State, enemy: Player, player: Player): Promise<void> => {
    if (enemy.locationId !== state.curch) {
        return;
    }
    if ((enemy.playerId < 0) || (enemy.playerId > 47)) {
        return;
    }
    return Promise.all([
        roll(),
        Promise.all([
            89,
            113,
            114,
        ].map(itemId => getItem(state, itemId))),
    ])
        .then(([
            hitRoll,
            shields,
        ]) => {
            const hasShield = shields.some(shield => isWornBy(state, shield, player));
            const chance = 3 * (15 - getLevel(state)) + 20 - (hasShield ? 10 : 0);
            return (hitRoll < chance)
                ? roll()
                    .then(damageRoll => damageRoll % enemy.damage)
                : -1;
        })
        .then(damage => sendDamage(state, player, {
            characterId: enemy.playerId,
            damage,
        }));
};

export const sendBotDamage = (state: State, player: Player, damage: number): Promise<void> => {
    if (!player.isBot) {
        return Promise.resolve();
    }
    const strength = player.strength - damage;
    if (strength >= 0) {
        return getPlayer(state, state.mynum)
            .then((me) => Promise.all([
                setPlayer(state, player.playerId, { strength }),
                setPlayerDamage(state, player, me),
            ]))
            .then(() => {});
    } else {
        return Promise.all([
            dropItems(state, player),
            sendWizards(state, `[ ${player.name} has just died ]\n`),
            setPlayer(state, player.playerId, {
                strength,
                exists: false,
            }),
        ])
            .then(() => {});
    }
};

export const teleport = (state: State, locationId: number): Promise<void> => {
    const oldLocationId = state.curch;
    state.curch = locationId;
    trapch(state, state.curch);
    return Promise.all([
        sendLocalMessage(state, oldLocationId, state.globme, sendVisiblePlayer(state.globme, `${state.globme} has left.\n`)),
        sendLocalMessage(state, locationId, state.globme, sendVisiblePlayer(state.globme, `${state.globme} has arrived.\n`)),
    ])
        .then(() => {});
};
