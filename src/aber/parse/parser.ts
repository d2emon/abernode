import State from "../state";
import {
    addWordChar,
    applyPronouns,
    getCurrentChar,
    getWordBuffer,
    nextStop,
    resetStop,
    resetWordBuffer,
    setStringBuffer
} from "./reducer";
import {isGod} from "../newuaf/reducer";
import Action from "../action";

const verbs = {};
const directions = {};
const actions = [];

const dodirn = (directionId: number): Action => new Action(directionId);

const nextWord = (state: State): Promise<string> => new Promise((resolve, reject) => {
    resetWordBuffer(state);
    while(getCurrentChar(state) === ' ') {
        nextStop(state);
    }
    while(getCurrentChar(state) && (getCurrentChar(state) !== ' ')) {
        addWordChar(state, getCurrentChar(state));
    }
    applyPronouns(state);
    const word = getWordBuffer(state);
    return word
        ? resolve(word)
        : reject(new Error());
});

interface WordSearch {
    itemId?: number,
    value: number,
}

 /*
int Match(x,y)
char *x,*y;
    {
    long  c,n;
    c=0; n=0;
    if (!strcmp(x,y)) return(10000);
    if(!strcmp(y,"reset")) return(-1);
    if (*x==0) return(0);
    while((x[n]!=0)&&(y[n]!=0))
       {
       if (x[n]==y[n])
          {
          if(n==0) c+=2;
          if(n==1) c++;
          c++;
          }
       n++;
       }
    return(c);
    }
*/

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
const searchList = (search: string, list: { [key: string]: number }): Promise<WordSearch> => Promise.resolve(
    Object.keys(list).reduce(
        (result: WordSearch, key) => {
            const value = match(search, key);
            return ((value >= 5) && (value > result.value))
                ? {
                    itemId: list[key],
                    value,
                }
               : result;
        },
        {
            itemId: undefined,
            value: 0,
        }
    )
);
const searchVerb = (command: string): Promise<number> => searchList(command.toLowerCase(), verbs)
    .then(result => result.itemId);
const searchDirection = (command: string): Promise<number> => searchList(command.toLowerCase(), directions)
    .then(result => result.itemId);

class DefaultAction extends Action {
    action(state: State): Promise<any> {
        if (isGod(state)) {
            throw new Error(`Sorry not written yet[COMREF ${this.actionId}]`);
        } else {
            throw new Error('I don\'t know that verb.');
        }
    }
}

const getAction = (actionId: number): Action => {
    if ((actionId > 1) && (actionId < 8)) {
        return dodirn(actionId);
    }
    return actions[actionId] || new DefaultAction(actionId);
};

export const executeCommand = (state: State, commandLine: string): Promise<void> => {
    if (commandLine !== '!') {
        setStringBuffer(state, commandLine);
    }
    if (commandLine === '.q') {
        commandLine = ''; /* Otherwise drops out after command */
    }
    resetStop(state);
    if (!commandLine) {
        return Promise.resolve();
    }
    return nextWord(state)
        .catch(() => Promise.reject(new Error('Pardon ?')))
        .then(searchVerb)
        .catch(() => Promise.reject(new Error('I don\'t know that verb')))
        .then(getAction)
        .then(action => action.perform(state));
};
