import State from "../state";
import {
    Player,
    getItem,
} from "../support";
import {OnExitEvent} from "./index";
import {isCarriedBy} from "../objsys";
import {isWizard} from "../newuaf/reducer";
import {
    sendName,
    sendVisibleName,
} from "../bprintf";
import {isWornBy} from "../new1";

const FIGURE = 'figure';
const GOLEM_ID = 25;
const SORCEROR_SIGNS = [
    101,
    102,
    103,
];

const golem = {
    onExit: (player: Player) => (state: State, actor: Player) => getItem(state, 32)
        .then((runeSword) => {
            if (
                isCarriedBy(runeSword, actor, !isWizard(state))
                    && player.exists
            ) {
                throw new Error(`${sendVisibleName('The Golem')} bars the doorway!`);
            }
        }),
};

const figure = {
    onExit: (player: Player) => (state: State, actor: Player, directionId: number) => {
        if (directionId !== 2) {
            return Promise.resolve();
        }
        return Promise.all(
            SORCEROR_SIGNS.map(itemId => getItem(state, itemId))
        )
            .then((signs) => {

                if (
                    player
                    && (player.playerId !== state.mynum)
                    && !signs.some(item => isWornBy(state, item, actor))
                ) {
                    throw new Error(`${sendName('The Figure')} holds you back\n`
                        + `${sendName('The Figure')} says \'Only true sorcerors may pass\'\n`);
                }
            })
    },
};

export const onExit = (character: Player): OnExitEvent => {
    if (character.playerId === GOLEM_ID) {
        return golem.onExit(character);
    } else if (character.name === FIGURE) {
        return figure.onExit(character);
    } else {
        return () => Promise.resolve();
    }
};
