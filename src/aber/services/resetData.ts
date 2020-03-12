import {RESET_DATA} from '../files';
import {ItemData} from "../state";

interface ResetData {
    items: ItemData[],
    time: Date,
}

const data: ResetData = {
    items: [],
    time: new Date(),
};

export default {
    getItems: (): Promise<ItemData[]> => Promise.resolve([...data.items]),
    getMessage: (): Promise<string> => Promise.resolve(`Last Reset At ${data.time}`),
    setTime: (time: Date): Promise<void> => new Promise((resolve) => {
        data.time = time;
        return resolve();
    }),
    getTime: (): Promise<number> => Promise.resolve(data.time.getTime()),
};
