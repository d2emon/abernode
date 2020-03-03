import State from "../state";
import {
    Player,
    getItem,
} from "../support";
import {OnEnterEvent} from "./index";

const isdark = (state: State): boolean => false;

const door = {
    onEnter: (doorId: number, otherSideId: number) => (state: State, actor: Player): Promise<number> => Promise.all([
        getItem(state, doorId),
        getItem(state, otherSideId),
    ])
        .then(([
            door,
            otherSide,
        ]) => {
            if (door.isOpen){
                return Promise.resolve(otherSide.locationId);
            }
            if ((door.name !== "door") || isdark(state) || !door.description.length) {
                throw new Error('You can\'t go that way\n');
                /* Invisible doors */
            } else {
                throw new Error('The door is not open\n');
            }
        }),
};

export const onEnter = (itemId: number): OnEnterEvent => {
    const otherSideId = (itemId % 2) ? (itemId - 1) : (itemId + 1); /* other door side */
    return door.onEnter(itemId, otherSideId);
};
