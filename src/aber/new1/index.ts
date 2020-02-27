import State from "../state";
import {brkword} from "../__dummies";
import {dropItems, findAvailableItem} from "../objsys";
import {getPlayer, Item, Player, setPlayer} from "../support";
import {sendWizards} from "./receivers";

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

export const receiveDamage = (state: State, player: Player, damage: number): Promise<void> => {
    const strength = player.strength - damage;
    if (strength >= 0) {
        return Promise.all([
            setPlayer(state, player.playerId, { strength }),
            mhitplayer(state, player.playerId, state.mynum),
        ])
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

