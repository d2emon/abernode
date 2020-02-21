import State from "../state";
import {getSnooped, startSnoop, stopSnoop} from "./reducer";
import {Player} from "../support";
import {sendsys} from "../__dummies";
import Snoop from '../services/snoop';

export const viewSnoop = (state: State, snooped: Player): Promise<void> => Snoop.connectSnoop(state.globme)
    .then(() => Snoop.readSnoop(state.globme))
    .then(text => text.forEach(s => console.log(`|${s}`)))
    .then(() => Snoop.clearSnoop(state.globme))
    .then(() => {
        stopSnoop(state);
        // showMessages(state);
        startSnoop(state, snooped);
    })
    .catch(() => null);
export const touchSnoop = (name: string): Promise<boolean> => Snoop.createSnoop(name);
export const writeSnoop = (name: string, text: string): Promise<void> => Snoop.connectSnoop(name)
    .then(() => Snoop.writeSnoop(name, text));

export const checkSnoop = (state: State): Promise<void> => getSnooped(state)
    .then(snooped => snooped && sendsys(
        state,
        snooped.name,
        state.globme,
        -400,
        0,
        null,
    ));
