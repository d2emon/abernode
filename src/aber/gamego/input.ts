const getInput = (): Promise<string> => Promise.resolve('');

export const getString = (maxLength: number): Promise<string> => getInput()
    .then((result) => result.substr(0, maxLength));
