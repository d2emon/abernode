let log = '';

export default {
    createLog: (): Promise<boolean> => new Promise((resolve) => {
        log = '';
        return resolve(true);
    }),
    connectLog: (): Promise<boolean> => Promise.resolve(true),
    stopLog: (): Promise<boolean> => Promise.resolve(true),
    getLog: (): Promise<string> => Promise.resolve(log),
    writeLog: (message: string): Promise<void> => new Promise(((resolve) => {
        log += `${message}\n`;
        return resolve();
    })),
};
