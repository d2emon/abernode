import State from "../state";
import {
    Player,
    getItem,
} from "../support";
import {OnExitEvent} from "./index";
import {isCarriedBy} from "../objsys";
import {isWizard} from "../newuaf/reducer";
import {
    playerName,
} from "../bprintf";
import {isWornBy} from "../new1";
import {playerIsMe} from "../tk/reducer";

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
                throw new Error(`${playerName(player)} bars the doorway!`); // The Golem
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
                    && !playerIsMe(state, player.playerId)
                    && !signs.some(item => isWornBy(state, item, actor))
                ) {
                    throw new Error(`${playerName(player)} holds you back\n`
                        + `${playerName(player)} says \'Only true sorcerors may pass\'\n`); // The Figure
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
