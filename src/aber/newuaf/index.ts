import State from "../state";
import Persons, {Person} from "../services/persons";
import {endGame} from "../gamego/endGame";

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

const createPerson = (name: string, person: Person): Promise<void> => Persons.findPerson(name)
    .then(found => found ? Persons.writePerson(found.personId, person) : Persons.addPerson(person))
    .catch(() => Persons.clearPersons().then(() => Promise.reject(new Error('Save Failed - Device Full ?'))));
