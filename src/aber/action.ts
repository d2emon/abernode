import State from "./state";

export interface ActionInterface {
    actionId: number,
    action(state: State): Promise<any>,
    check(state: State): Promise<void>,
    decorate(result: any): void,
    output(message: string): void,
    perform(state: State): Promise<void>,
}

class Action implements ActionInterface {
    actionId = undefined;

    constructor(actionId: number) {
        this.actionId = actionId;
    }

    action(state: State): Promise<any> {
        return Promise.reject(new Error('Not implemented'));
    };

    check(state: State): Promise<void> {
        return Promise.resolve();
    }

    decorate(result: any): void {
        return;
    };

    output(message: string): void {
        console.log(message)
    }

    perform(state: State): Promise<void> {
        return this.check(state)
            .then(() => state)
            .then(this.action)
            .then(this.decorate)
            .catch(e => this.output(`${e}\n`));
    }
}

export default Action;
