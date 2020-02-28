import State from "../state";
import Persons, {Person} from '../services/persons';
import {getPlayer} from "../support";
import {bprintf} from "../__dummies";
import {findItem} from "../objsys";
import {showMessages} from "../bprintf/output";
import {endGame} from "../gamego/endGame";
import {getString} from "../gamego/input";
import {sendMessage} from "../bprintf/bprintf";
import {getLevel, getScore, getSex, getStrength, setLevel, setScore, setSex, setStrength, updateScore} from "./reducer";

const initme = (state: State): Promise<void> => Persons.findPerson(state.globme)
    .then((person) => {
        const moan1 = (state: State) => {
            bprintf(state, '\nSex (M/F) : ');
            return showMessages(state)
                .then(() => getString(2))
                .then(sex => sex.toLowerCase())
                .then((sex) => {
                    if (sex === 'm') {
                        setSex(state, 0);
                    } else if (sex === 'f') {
                        setSex(state, 1);
                    } else {
                        bprintf(state, 'M or F');
                        return moan1(state)
                    }
                });
        };

        if (person) {
            const {
                strength,
                score,
                level,
                sex,
            } = person;
            setStrength(state, strength);
            setScore(state, score);
            setLevel(state, level);
            setSex(state, sex);
            return Promise.resolve();
        }

        bprintf(state, 'Creating character....\n');
        setScore(state, 0);
        setStrength(state, 40);
        setLevel(state, 1);
        return moan1(state)
            .then(() => createPerson(
                state.globme,
                {
                    name: state.globme,
                    strength: getStrength(state),
                    level: getLevel(state),
                    sex: getSex(state),
                    score: getScore(state),
                },
            ))
            .catch(error => sendMessage(state, `${error}\n`));
    })
    .catch(() => endGame(state, 'Panic: Timeout event on user file'));

const saveme = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((player) => {
        if (state.zapped) {
            return;
        }
        bprintf(state, `\nSaving ${state.globme}\n`);
        return createPerson(
            state.globme,
            {
                name: state.globme,
                strength: getStrength(state),
                level: getLevel(state),
                sex: player.sex, // player.flags,
                score: getScore(state),
            },
        );
    })
    .catch(error => sendMessage(state, `${error}\n`));

const validname = (state: State, name: string): Promise<boolean> => {
    if (resword(state, name)) {
        bprintf(state, 'Sorry I cant call you that\n');
        return Promise.resolve(false);
    }
    if (name.length > 10) {
        return Promise.resolve(false);
    }
    if (name.indexOf(' ')) {
        return Promise.resolve(false);
    }
    return findItem(state, name)
        .then((item) => {
            if (item.itemId !== -1) {
                bprintf(state, 'I can\'t call you that , It would be confused with an object\n');
                return false;
            }
        })
        .then(() => true);
};

/*
resword(name)
{
if(!strcmp(name,"The")) return(1);
if(!strcmp(name,"Me")) return(1);
if(!strcmp(name,"Myself")) return(1);
if(!strcmp(name,"It")) return(1);
if(!strcmp(name,"Them")) return(1);
if(!strcmp(name,"Him")) return(1);
if(!strcmp(name,"Her")) return(1);
if(!strcmp(name,"Someone")) return(1);
return(0);
}
 */