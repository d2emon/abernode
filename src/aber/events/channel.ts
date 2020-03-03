import State from "../state";
import {
    Player,
    getItem,
} from "../support";
import {isWornBy} from "../new1";
import {sendMessage} from "../bprintf/bprintf";
import {OnEnterEvent} from "./index";

const SHIELD_IDS = [89, 113, 114];

const channel139 = {
    onEnter: (state: State, actor: Player): Promise<number> => Promise.all(
        SHIELD_IDS.map(itemId => getItem(state, itemId))
    )
        .then(shields => shields.filter(shield => isWornBy(state, shield, actor)))
        .then((shields) => {
            if (!shields.length) {
                throw new Error('The intense heat drives you back');
            }
            return sendMessage(state, 'The shield protects you from the worst of the lava stream\'s heat\n');
        })
        .then(() => -139),
};

export const onEnter = (channelId: number): OnEnterEvent => {
    if (channelId === -139) {
        return channel139.onEnter;
    } else {
        return () => Promise.resolve(channelId);
    }
};
