import State from "./state";

export interface ActionInterface {
    action(state: State): Promise<any>,
    check(state: State): Promise<void>,
    decorate(result: any): Promise<void>,
    perform(state: State): Promise<void>,
}

class Action implements ActionInterface {
    action(state: State): Promise<any> {
        return Promise.reject(new Error('Not implemented'));
    };

    check(state: State): Promise<void> {
        return Promise.resolve();
    }

    decorate(result: any): Promise<void> {
        return Promise.reject(new Error('Not implemented'));
    };

    perform(state: State): Promise<void> {
        return this.check(state)
            .then(() => state)
            .then(this.action)
            .then(this.decorate);
    }
}

export default Action;
