import State from "../state";
import {isWizard} from "../newuaf/reducer";
import {findZone, zones} from "./index";
import Action from "../action";
import {getExit} from "./reducer";

export class Exits extends Action {
    private static directions = [
        'North',
        'East',
        'South',
        'West',
        'Up',
        'Down',
    ];

    action(state: State): Promise<any> {
        const messages = [];
        for (let directionId = 0; directionId < 6; directionId += 1) {
            const newLocationId = getExit(state, directionId);
            if (newLocationId >= 0) {
                continue;
            }
            if (!isWizard(state)) {
                messages.push(`${Exits.directions[directionId]}\n`);
            } else {
                const {
                    name,
                    channelId,
                } = findZone(newLocationId);
                messages.push(`${Exits.directions[directionId]} : ${name}${channelId}\n`);
            }
        }
        return Promise.resolve(messages);
    }

    decorate(result: any): void {
        this.output('Obvious exits are\n');
        if (!result) {
            this.output('None....\n')
        } else {
            result.forEach(s => this.output(`${s}\n`));
        }
    }
}

export class Locations extends Action {
    check(state: State): Promise<void> {
        if (!isWizard(state)) {
            throw new Error('Oh go away, thats for wizards');
        }
        return Promise.resolve();
    }

    action(state: State): Promise<any> {
        return Promise.resolve(zones.map(zone => zone.name));
    }

    decorate(result: any): void {
        this.output('\nKnown Location Nodes Are\n\n');
        result.forEach((zone, zoneId) => {
            this.output(zone);
            if (zoneId % 4 === 3) {
                this.output('\n');
            }
            this.output('\n');
        })
    }
}