export interface SearchResult {
    itemId?: string,
    item?: any,
    value: number,
}

const match = (word1: string, word2: string): number => {
    if (!word1) {
        return undefined;
    }
    if (word1 === word2) {
        return 10000;
    }
    if (word2 === 'reset') {
        return undefined;
    }
    let value = 0;
    for (let i = 0; (i < word1.length) && (i < word2.length); i += 1) {
        if (word1[i] !== word2[i]) {
        } else if (i === 0) {
            value += 3;
        } else if (i === 1) {
            value += 2;
        } else {
            value += 1;
        }
    }
    return value;
};
export const searchList = (search: string, list: { [key: string]: any }): Promise<SearchResult> => Promise.resolve(
    Object.keys(list).reduce(
        (result: SearchResult, key) => {
            const value = match(search, key);
            return ((value >= 5) && (value > result.value))
                ? {
                    itemId: key,
                    item: list[key],
                    value,
                }
               : result;
        },
        {
            itemId: undefined,
            item: undefined,
            value: 0,
        }
    )
);
/*
const searchDirection = (command: string): Promise<number> => searchList(command.toLowerCase(), directions)
    .then(result => result.itemId);
*/
