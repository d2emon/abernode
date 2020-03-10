import State from "../state";
import {
    Player,
    getItem, setItem, Item, putItem,
} from "../support";
import {isWornBy} from "../new1";
import {sendMessage} from "../bprintf/bprintf";
import {OnDropEvent, OnEnterEvent, OnGetEvent} from "./index";
import {updateScore} from "../newuaf/reducer";
import {sendLocalMessage, sendMyMessage} from "../parse/events";
import {getLocationId} from "../tk/reducer";
import {calibrate} from "../parse";

const SHIELD_IDS = [89, 113, 114];

const noChannel = {
    onAfterGet: () => Promise.resolve(undefined),
    onDrop: () => Promise.resolve(),
    onEnter: () => Promise.resolve(undefined),
};

const defaultEvents = {
    onAfterGet: (state: State, actor: Player, item: Item): Promise<Item> => Promise.resolve(item),
    onDrop: () => Promise.resolve(),
    onEnter: (channelId: number) => () => Promise.resolve(channelId),
};

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

const channel183 = {
    onDrop: (state: State, actor: Player, item: Item): Promise<void> => Promise.all([
        sendMyMessage(state, `The ${item.name} disappears into the bottomless pit.\n`),
        calibrate(state, actor, item.value),
        putItem(state, item.itemId, -6),
        sendMessage(state, 'It disappears down into the bottomless pit.....\n')
    ])
        .then(() => null),
};

const channel1081 = {
    onAfterGet: (state: State, actor: Player, item: Item): Promise<Item> => Promise.all([
        sendMessage(state, 'The door clicks shut....\n'),
        setItem(state, 20, {state: 1}),
    ])
        .then(() => item),
};


export const onAfterGet = (channelId: number): OnGetEvent => {
    if (!channelId) {
        return noChannel.onAfterGet;
    } else if (channelId === -1081) {
        return channel1081.onAfterGet;
    } else {
        return defaultEvents.onAfterGet;
    }
};

export const onDrop = (channelId: number): OnDropEvent => {
    if (!channelId) {
        return noChannel.onDrop;
    } else if (channelId === -183) {
        return channel183.onDrop;
    } else {
        return defaultEvents.onDrop;
    }
};

export const onEnter = (channelId: number): OnEnterEvent => {
    if (!channelId) {
        return noChannel.onEnter;
    } else if (channelId === -139) {
        return channel139.onEnter;
    } else {
        return defaultEvents.onEnter(channelId);
    }
};
