import State from "../state";
import {
    brkword,
    sendsys,
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

const openworld = (state: State): void => undefined;
const trapch = (state: State, locationId: number): void => undefined;

/**
 * Extensions section 1
 */

/* Door is 6 panel 49 */

export const getAvailableItem = (state: State): Promise<Item> => {
    if (brkword(state) === -1) {
        throw new Error('Tell me more ?');
    }
    openworld(state);
    return findAvailableItem(state, state.wordbuf)
        .then((item) => {
            if (!item) {
                throw new Error('There isn\'t one of those here');
            }
            return item;
        })
};

export const isWornBy = (state: State, item: Item, player: Player): boolean => {
    if (!isCarriedBy(item, player, (state.my_lev < 10))) {
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
            const chance = 3 * (15 - state.my_lev) + 20 - (hasShield ? 10 : 0);
            return (hitRoll < chance)
                ? roll()
                    .then(damageRoll => damageRoll % enemy.damage)
                : -1;
        })
        .then((damage) => sendsys(
            state,
            state.globme,
            enemy.name,
            -10021,
            enemy.locationId,
            {
                characterId: enemy.playerId,
                damage,
            },
        ));
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

export const teleport = (state: State, locationId: number): void => {
    sendsys(
        state,
        state.globme,
        state.globme,
        -10000,
        state.curch,
        sendVisiblePlayer(state.globme, `${state.globme} has left.\n`),
    );
    state.curch = locationId;
    trapch(state, state.curch);
    sendsys(
        state,
        state.globme,
        state.globme,
        -10000,
        state.curch,
        sendVisiblePlayer(state.globme, `${state.globme} has arrived.\n`),
    );
};
