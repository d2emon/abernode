import State from "../state";
import {bprintf, brkword} from "../__dummies";
import {findAvailableItem, findVisiblePlayer, isCarriedBy} from "../objsys";
import {getItem, getPlayer, Item, Player} from "../support";
import {roll} from "../magic";
import {sendMessage} from "../bprintf/bprintf";

const openworld = (state: State): void => undefined;

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

/* This one isnt for magic */

const getTargetPlayer = (state: State): Promise<Player> => {
    if (brkword(state) === -1) {
        throw new Error('Who ?');
    }
    openworld(state);
    if (state.wordbuf === 'at') {
        /* STARE AT etc */
        return getTargetPlayer(state);
    }
    return findVisiblePlayer(state, state.wordbuf)
        .then((player) => {
            if (!player) {
                throw new Error('Who ?');
            }
            return player;
        })
};

export const getAvailablePlayer = (state: State): Promise<Player> => getTargetPlayer(state)
    .then((player) => {
        if (player.locationId !== state.curch) {
            throw new Error('They are not here');
        }
        return player;
    });

const spellFails = (state: State, mode: number) => sendMessage(state, 'You fumble the magic\n')
    .then(() => {
        if (mode !== 1) {
            return undefined;
        }
        return sendMessage(state, 'The spell reflects back\n')
            .then(() => getPlayer(state, state.mynum));
    });

const spellSuccess = (state: State) => (
    (state.my_lev < 10)
        ? sendMessage(state, 'The spell succeeds!!\n')
        : Promise.resolve()
);

const getSpellTarget = (state: State, mode: number): Promise<Player> => getTargetPlayer(state)
    .then((player) => {
        if (state.my_str < 10) {
            throw new Error('You are too weak to cast magic');
        }
        if (state.my_lev < 10) {
            state.my_str -= 2;
        }
        return Promise.all([
            Promise.resolve(player),
            Promise.all([
                111,
                121,
                163,
            ].map(itemId => getItem(state, itemId))),
            roll(),
        ]);
    })
    .then(([
        player,
        items,
        successRoll,
    ]) => {
        const bonus = items.filter(item => isCarriedBy(item, player, (state.my_lev < 10))).length;
        const chance = (bonus + 5) * state.my_lev;
        if ((state.my_lev < 10) && (successRoll > chance)) {
            return spellFails(state, mode);
        } else {
            return spellSuccess(state)
                .then(() => player);
        }
    })
    .then((target) => {
        if (!target) {
            throw new Error();
        }
        return target;
    });

const vicfb = (state: State) => getSpellTarget(state, 0);
const victim = (state: State) => getSpellTarget(state, 1);

