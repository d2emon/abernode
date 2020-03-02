import {UAF_RAND} from '../files';

export interface Person {
    personId?: number,
    name: string,
    score: number,
    strength: number,
    sex: number,
    level: number,
}

const uafError = () => Promise.reject(new Error('Cannot access UAF'));
const data: Person[] = [];

export default {
    clearPersons: (): Promise<boolean> => Promise.resolve(true).catch(uafError),
    findPersons: (name: string): Promise<Person[]> => Promise.resolve(data.filter(person => (person.name.toLowerCase() === name))),
    findPerson: (name: string): Promise<Person> => Promise.resolve(data.find(person => (person.name.toLowerCase() === name))),
    writePerson: (personId: number, person: Person): Promise<void> => new Promise(((resolve) => {
        data[personId] = person;
        return resolve();
    })),
    addPerson: (person: Person): Promise<void> => new Promise(((resolve) => {
        data.push({
            ...person,
            personId: data.length,
        });
        return resolve();
    })),
};
