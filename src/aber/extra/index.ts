import State from '../state';
import {
    CONTAINED_IN,
    LOCATED_IN,
} from '../object';
import {
    getItem,
    getPlayer,
} from '../support';
import {sendVisibleName} from '../bprintf';

const openroom = (state: State, locationId: number, permissions: string): Promise<any> => Promise.resolve({});
const showname = (state: State, locationId: number): string => '';
const fclose = (file: any): Promise<void> => Promise.resolve();
const getstr = (file: any): Promise<string[]> => Promise.resolve([]);

const showChannel = (state: State, locationId: number) => (channel: any): Promise<string> => getstr(channel)
    .then((text) => {
        const short = text[7];
        const name = (state.my_lev > 9) ? ` | ${showname(state, locationId)}` : '';
        return fclose(channel).then(() => `${short}${name}`);
    });

export const showLocation = (state: State, locationId: number, carryFlag: number): Promise<string> => {
    if ((state.my_lev < 10) && (carryFlag === LOCATED_IN) && (locationId > -5)) {
        return Promise.resolve('Somewhere.....');
    }
    if (carryFlag === CONTAINED_IN) {
        return getItem(state, locationId)
            .then(item => `In the ${item.name}`);
    }
    if (carryFlag !== LOCATED_IN) {
        return getPlayer(state, locationId)
            .then(player => `Carried by ${sendVisibleName(player.name)}`);
    }
    return openroom(state, locationId, 'r')
        .then(showChannel(state, locationId))
        .catch(() => 'Out in the void');
};