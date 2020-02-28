export const roll = (): Promise<number> => Promise.resolve(Math.floor(Math.random() % 100));
export const checkRoll = (callback: (result: number) => boolean): Promise<boolean> => roll().then(callback);

