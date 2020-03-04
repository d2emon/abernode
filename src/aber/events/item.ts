import State from "../state";
import {
    Item,
    Player,
    getItem,
    createItem,
    getHelper, getItems, setItem,
} from "../support";
import {
    OnDropEvent,
    OnEnterEvent,
    OnGetEvent,
} from "./index";
import {
    RUNE_SWORD_ID,
    SHIELD_BASE_ID,
    SHIELD_IDS,
} from "../objsys";
import {isWizard} from "../newuaf/reducer";

const isdark = (state: State): boolean => false;

const noItem = {
    onAfterGet: () => Promise.resolve(undefined),
    onDrop: () => Promise.resolve(),
    onEnter: () => Promise.resolve(undefined),
    onGet: () => Promise.resolve(undefined),
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
    onDrop: () => Promise.resolve(),
    onGet: (state: State, actor: Player, item: Item): Promise<Item> => {
        const actions = [];
        if (item.flannel) {
            actions.push(Promise.reject(new Error('You can\'t take that!')));
        }
        return Promise.all(actions)
            .then(() => item);
    },
    // onEnter: () => () => Promise.resolve(0),
};

const door = {
    onEnter: (item: Item): OnEnterEvent => (state: State): Promise<number> => {
        if (item.isOpen){
            const otherSideId = (item.itemId % 2) ? (item.itemId - 1) : (item.itemId + 1); /* other door side */
            return getItem(state, otherSideId)
                .then(otherSide => otherSide.locationId);
        }
        const invisible = (item.name !== "door") || isdark(state) || !item.description.length;
        return Promise.reject(invisible
            ? new Error('You can\'t go that way')
            : new Error('The door is not open')
        );
    },
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

export const onAfterGet = (item: Item): OnGetEvent => {
    if (!item) {
        return noItem.onAfterGet;
    } else {
        return defaultEvents.onAfterGet;
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
