import State from "../state";
import Persons, {Person} from "../services/persons";
import {endGame} from "../gamego/endGame";
import {sendAndShow, showMessages} from "../bprintf/output";
import {getString} from "../gamego/input";
import {getPerson, setPerson} from "./reducer";
import {sendMessage} from "../bprintf/bprintf";
import {getPlayer, Player} from "../support";
import {findItem} from "../objsys";
import {getName} from "../tk/reducer";
import {sendBaseMessage} from "../bprintf";
import {canSave} from "../parse/reducer";

export const removePerson = (state: State, name: string): Promise<void> => Persons.findPersons(name)
    .then(persons => persons.forEach((person) => {
        if (name.toLowerCase() !== person.name.toLowerCase()) {
            throw new Error('Panic: Invalid Persona Delete');
        }
        return Persons.writePerson(
            person.personId,
            {
                ...person,
                name: '',
                level: -1,
            },
        );
    }))
    .catch(error => endGame(state, error));

const createPerson = (person: Person): Promise<void> => Persons.findPerson(person.name)
    .then(found => found ? Persons.writePerson(found.personId, person) : Persons.addPerson(person))
    .catch(() => Persons.clearPersons().then(() => Promise.reject(new Error('Save Failed - Device Full ?'))));

const inputSex = (state: State): Promise<number> => sendAndShow(state, '\nSex (M/F) : ')
    .then(() => getString(2))
    .then(sex => sex.toLowerCase())
    .then((sex) => {
        if (sex === 'm') {
            return 0;
        } else if (sex === 'f') {
            return 1;
        } else {
            return sendBaseMessage(state, 'M or F')
                .then(() => inputSex(state));
        }
    });

const addPerson = (state: State): Promise<void> => sendBaseMessage(state, 'Creating character....\n')
    .then(() => inputSex(state))
    .then((sex: number): Person => getPerson(state, {
        strength: 40,
        level: 1,
        sex,
        score: 0,
    }))
    .then((newPerson: Person) => {
        setPerson(state, newPerson);
        return createPerson(newPerson);
    })
    .catch(error => sendMessage(state, `${error}\n`));

export const initPerson = (state: State): Promise<void> => Persons.findPerson(getName(state))
    .then(person => (
        person
            ? setPerson(state, person)
            : addPerson(state)
    ))
    .catch(() => endGame(state, 'Panic: Timeout event on user file'));

export const savePerson = (state: State, actor: Player): Promise<void> => {
    if (!canSave(state)) {
        return Promise.resolve();
    }
    return sendBaseMessage(state, `\nSaving ${getName(state)}\n`)
        .then(() => getPerson(state, {
            sex: actor.sex, // player.flags
        }))
        .then(person => createPerson(person))
        .catch(error => sendMessage(state, `${error}\n`));
};

const isReservedWord = (name: string): boolean => ([
    'The',
    'Me',
    'Myself',
    'It',
    'Them',
    'Him',
    'Her',
    'Someone',
].indexOf(name) !== -1);

const validateName = (state: State, name: string, actor: Player): Promise<boolean> => {
    if (isReservedWord(name)) {
        throw new Error('Sorry I cant call you that');
    }
    if (name.length > 10) {
        throw new Error();
    }
    if (name.indexOf(' ')) {
        throw new Error();
    }
    return findItem(state, name, actor)
        .then((item) => {
            if (item) {
                throw new Error('I can\'t call you that , It would be confused with an object');
            } else {
                return true
            }
        });
};
