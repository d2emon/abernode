import Action from "../action";
import State from "../state";
import {isWizard} from "../newuaf/reducer";
import {getPronoun} from "./reducer";

export class Pronouns extends Action {
    action(state: State): Promise<any> {
        return Promise.resolve({
            me: getPronoun(state, 'me'),
            myself: getPronoun(state, 'myself'),
            it: getPronoun(state, 'it'),
            him: getPronoun(state, 'him'),
            her: getPronoun(state, 'her'),
            them: getPronoun(state, 'them'),
            there: isWizard(state) && getPronoun(state, 'there'),
        });
    }

    decorate(result: any): void {
        const {
            me,
            myself,
            it,
            him,
            her,
            them,
            there,
        } = result;
        this.output('Current pronouns are:\n');
        this.output(`Me              : ${me}\n`);
        this.output(`Myself          : ${myself}\n`);
        this.output(`It              : ${it}\n`);
        this.output(`Him             : ${him}\n`);
        this.output(`Her             : ${her}\n`);
        this.output(`Them            : ${them}\n`);
        if (there) {
            this.output(`There           : ${there}\n`);
        }
    }
}