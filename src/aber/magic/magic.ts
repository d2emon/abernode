import {
    bprintf,
    brkword,
    sendsys,
} from '../__dummies';
import State from '../state';
import {createItem, putItem} from "../support";
import {findItem} from "../objsys";

const ressurcom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'Huh ?\n');
        return Promise.resolve();
    }
    if (brkword(state) === -1) {
        bprintf(state, 'Yes but what ?\n');
        return Promise.resolve();
    }
    return findItem(state, state.wordbuf)
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'You can only ressurect objects\n')
            }
            if (!item.isDestroyed) {
                return bprintf(state, 'That already exists\n')
            }
            return createItem(state, item.itemId)
                .then((created) => putItem(state, created.itemId, state.curch))
                .then(() => {
                    const bf = `The ${item.name} suddenly appears\n`;
                    sendsys(state, null, null, -10000, state.curch, bf);
                });
        });
};
