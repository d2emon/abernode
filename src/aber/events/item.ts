import State from "../state";
import {
    Item,
    Player,
    getItem,
    createItem,
    getHelper, getItems, setItem,
} from "../support";
import {
    OnBreakEvent,
    OnDropEvent,
    OnEnterEvent,
    OnGetEvent, OnHitEvent,
} from "./index";
import {
    isCarriedBy,
    isDark,
    SHIELD_BASE_ID,
    SHIELD_IDS,
} from "../objsys";
import {getLevel, getStrength, isWizard, updateScore, updateStrength} from "../newuaf/reducer";
import {getLocationId} from "../tk/reducer";
import {teleport} from "../new1";
import {IS_DESTROYED} from "../object";
import {sendMessage} from "../bprintf/bprintf";
import {calibrate} from "../parse";
import {sendBaseMessage} from "../bprintf";
import {Reset} from "../parse/actions";

const SCEPTRE_ID = 16;
const RUNE_SWORD_ID = 32;

const noItem = {
    onAfterGet: () => Promise.resolve(undefined),
    onBreak: () => Promise.reject(new Error('What is that?')),
    onDrop: () => Promise.resolve(),
    onEat: () => Promise.resolve(),
    onEnter: () => Promise.resolve(undefined),
    onGet: () => Promise.resolve(undefined),
    onHit: () => Promise.resolve(undefined),
};

const defaultEvents = {
    onAfterGet: (state: State, actor: Player, item: Item): Promise<Item> => {
        const actions = [];
        if (item.changeStateOnTake) {
            actions.push(setItem(state, item.itemId, { state: 0 }));
        }
        return Promise.all(actions)
            .then(() => item);
    },
    onBreak: () => Promise.reject(new Error('You can\'t do that')),
    onDrop: () => Promise.resolve(),
    onEat: (state: State, actor: Player, item: Item): Promise<void> => item.isFood
        ? setItem(state, item.itemId, { flags: { [IS_DESTROYED]: true }})
            .then(() => sendBaseMessage(state, 'Ok....\n'))
            .then(() => {
                updateStrength(state, 12);
                return calibrate(state, actor);
            })
        : Promise.reject(new Error('Thats sure not the latest in health food....')),
    onGet: (state: State, actor: Player, item: Item): Promise<Item> => {
        const actions = [];
        if (item.flannel) {
            actions.push(Promise.reject(new Error('You can\'t take that!')));
        }
        return Promise.all(actions)
            .then(() => item);
    },
    // onEnter: () => () => Promise.resolve(0),
    onHit: (state: State, actor: Player, target: Player, item: Item): Promise<Item> => Promise.resolve(item),
};

const door = {
    onEnter: (item: Item): OnEnterEvent => (state: State): Promise<number> => {
        if (item.isOpen){
            const otherSideId = (item.itemId % 2) ? (item.itemId - 1) : (item.itemId + 1); /* other door side */
            return getItem(state, otherSideId)
                .then(otherSide => otherSide.locationId);
        }
        return isDark(state, getLocationId(state))
            .then(dark => dark || (item.name !== "door") || !item.description.length)
            .then(invisible => Promise.reject(invisible
                ? new Error('You can\'t go that way')
                : new Error('The door is not open')
            ));
    },
};

const item11 = {
    onEat: (state: State, actor: Player, item: Item): Promise<void> => defaultEvents.onEat(state, actor, item)
        .then(() => sendBaseMessage(
            state,
            'You feel funny, and then pass out\n'
                + 'You wake up elsewhere....\n'
        ))
        .then(() => teleport(state, -1076, actor)),
};

const runeSword = {
    onDrop: (state: State, actor: Player, item: Item): Promise<void> => {
        const actions = [];
        if (!isWizard(state)) {
            actions.push(Promise.reject(new Error('You can\'t let go of it!')));
        }
        return Promise.all(actions)
            .then(() => null);
    },
    onGet: (state: State, actor: Player, item: Item): Promise<Item> => getHelper(state)(actor)
        .then(helper => (item.state === 1)
            && !helper
            && Promise.reject(new Error('Its too well embedded to shift alone.')))
        .then(() => item),
    onHit: (state: State, actor: Player, target: Player, item: Item): Promise<Item> => getItem(state, SCEPTRE_ID)
        .then((sceptre) => {
            if (isCarriedBy(sceptre, target, !isWizard(state))) {
                throw new Error('The runesword flashes back away from its target, growling in anger!');
            }
        })
        .then(() => item),
};

const item75 = {
    onEat: (state: State, actor: Player, item: Item): Promise<void> => defaultEvents.onEat(state, actor, item)
        .then(() => sendBaseMessage(state, 'very refreshing\n')),
};

const shield = {
    onGet: (state: State, actor: Player, item: Item): Promise<Item> => {
        if (item.containedIn) {
            return Promise.resolve(item);
        }
        return getItems(state)
            .then(items => items.find(shield => (shield.itemId in SHIELD_IDS) && shield.isDestroyed))
            .then((shield: Item) => shield
                ? createItem(state, shield.itemId)
                : Promise.reject(new Error('The shields are all to firmly secured to the walls'))
            );
    },
};

const item171 = {
    onBreak: (state: State) => Reset.sysReset(state),
};

const item175 = {
    onEat: (state: State, actor: Player, item: Item): Promise<void> => defaultEvents.onEat(state, actor, item)
        .then(() => {
            if (getLevel(state) < 3) {
                updateScore(state, 40);
                return 'You feel a wave of energy sweeping through you.\n';
            } else {
                if (getStrength(state) < 40) {
                    updateStrength(state, 2);
                }
                return 'Faintly magical by the taste.\n';
            }
        })
        .then(message => Promise.all([
            calibrate(state, actor),
            sendMessage(state, message),
        ]))
        .then(() => null),
};

export const onAfterGet = (item: Item): OnGetEvent => {
    if (!item) {
        return noItem.onAfterGet;
    } else {
        return defaultEvents.onAfterGet;
    }
};

export const onBreak = (item: Item): OnBreakEvent => {
    if (!item) {
        return noItem.onBreak;
    } else if (item.itemId === 171) {
        return item171.onBreak;
    } else {
        return defaultEvents.onBreak;
    }
};

export const onDrop = (item: Item): OnDropEvent => {
    if (!item) {
        return noItem.onDrop;
    } else if (item.itemId === RUNE_SWORD_ID) {
        return runeSword.onDrop;
    } else {
        return defaultEvents.onDrop;
    }
};

export const onEat = (item: Item): OnDropEvent => {
    if (!item) {
        return noItem.onEat;
    } else if (item.itemId === 11) {
        return item11.onEat;
    } else if (item.itemId === 75) {
        return item75.onEat;
    } else if (item.itemId === 175) {
        return item175.onEat;
    } else {
        return defaultEvents.onEat;
    }
};

export const onEnter = (item: Item): OnEnterEvent => {
    if (!item) {
        return noItem.onEnter;
    } else {
        return door.onEnter(item);
    }
};

export const onGet = (item: Item): OnGetEvent => {
    if (!item) {
        return noItem.onGet;
    } else if (item.itemId === RUNE_SWORD_ID) {
        return runeSword.onGet;
    } else if (item.itemId === SHIELD_BASE_ID) {
        return shield.onGet;
    } else {
        return defaultEvents.onGet;
    }
};

export const onHit = (item: Item): OnHitEvent => {
    if (!item) {
        return noItem.onHit;
    } else if (item.itemId === RUNE_SWORD_ID) {
        return runeSword.onHit;
    } else {
        return defaultEvents.onHit;
    }
};
