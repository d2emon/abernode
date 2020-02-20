import {SNOOP} from '../files';
import State from "../state";
import {getSnooped, startSnoop, stopSnoop} from "./reducer";

export const openSnoop = (name: string, permissions: string): Promise<any> => Promise.resolve({
    fileId: 1,
    fileName: `${SNOOP}${name}`,
    permissions,
});

const viewSnoop = (state: State): Promise<void> => Promise.all([
    getSnooped(state),
    openSnoop(state.globme, 'r+'),
])
    .then(([
        snooped,
        snoopFile
    ]) => snooped && fgets(state, 127, snoopFile)
        .then((z) => {
            z.forEach(s => console.log(`|${s}`));
            return ftruncate(snoopFile, 0)
        })
        .then(() => fcloselock(snoopFile))
        .then(() => {
            stopSnoop(state);
            // showMessages(state);
            startSnoop(state, snooped);
        })
    )
    .catch(() => null);
