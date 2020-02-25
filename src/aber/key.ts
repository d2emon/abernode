const getInput = (): Promise<string> => Promise.resolve('');

export interface InputData {
    inInput: boolean,
    prompt: string,
    input: string,
    needPrompt: boolean,
    needLineBreak: boolean,
    toPrompt: boolean,
}

const inputData: InputData = {
    inInput: false,
    prompt: '',
    input: '',
    needPrompt: false,
    needLineBreak: false,
    toPrompt: false,
};

export const clearLineBreak = (): void => {
    inputData.needLineBreak = false;
};
export const checkLineBreak = (): InputData => {
    inputData.needPrompt = true;
    inputData.toPrompt = inputData.inInput;
    return inputData;
};
export const checkPrompt = (): InputData => {
    inputData.needLineBreak = true;
    if (inputData.toPrompt) {
        return inputData;
    }
    inputData.needPrompt = false;
    inputData.toPrompt = false;
    return inputData;
};

const startInput = (prompt: string): Promise<void> => new Promise((resolve) => {
    inputData.inInput = true;
    inputData.prompt = prompt;
    inputData.input = '';
    inputData.toPrompt = true;
    return resolve();
});
const stopInput = (input: string): Promise<void> => new Promise((resolve) => {
    inputData.inInput = false;
    inputData.input = input;
    inputData.toPrompt = false;
    return resolve();
});

export const keyInput = (prompt: string, maxLength: number): Promise<string> => startInput(prompt)
    .then(getInput)
    .then(input => input.substr(0, maxLength))
    .then(stopInput)
    .then(() => inputData.input);
