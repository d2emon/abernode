import {SNOOP} from '../files';

interface SnoopData {
    snoopId: string,
    text: string[],
}

const getSnoopId = (name: string) => `${SNOOP}${name}`;
const getSnoop = (name: string) => snoop[getSnoopId(name)];
const snoop: { [key: string]: SnoopData } = {};

export default {
    createSnoop: (snoopId: string): Promise<boolean> => new Promise((resolve) => {
        snoop[getSnoopId(snoopId)] = {
            snoopId,
            text: [],
        };
        return resolve(true);
    }),
    connectSnoop: (snoopId: string): Promise<boolean> => Promise.resolve(!!getSnoop(snoopId)),
    stopSnoop: (): Promise<boolean> => Promise.resolve(true),
    readSnoop: (snoopId: string): Promise<string[]> => Promise.resolve(getSnoop(snoopId).text),
    writeSnoop: (snoopId: string, message: string): Promise<void> => new Promise(((resolve) => {
        getSnoop(snoopId).text.push(message);
        return resolve();
    })),
    clearSnoop: (snoopId: string): Promise<void> => new Promise(((resolve) => {
        getSnoop(snoopId).text = [];
        return resolve();
    })),
};
