import Action from '../action';
import State from '../state';
import {
    getLogFile,
    getSnooped,
    setLogFile,
    startSnoop,
    stopSnoop,
} from './reducer';
import {Player} from '../support';
import {findVisiblePlayer} from '../objsys';
import {touchSnoop} from './snoop';
import LogService from '../services/log';
import {isGod, isWizard} from "../newuaf/reducer";
import {sendSnoop, sendStopSnoop} from "../parse/events";
import {getName} from "../tk/reducer";

const geteuid = (state: State): void => undefined;
const getuid = (state: State): void => undefined;

// Actions

export class Log extends Action {
    private static canLog(state: State): boolean {
        return getuid(state) === geteuid(state);
    }

    private static startLog(state: State) {
        return LogService.connectLog()
            .catch(() => LogService.createLog())
            .catch(() => Promise.reject(new Error('Cannot open log file mud_log')))
            .then(() => setLogFile(state, true))
            .then(() => ({ logFile: getLogFile(state) }))
            .catch((e) => {
                setLogFile(state, false);
                throw e;
            });
    };

    private static stopLog(state: State) {
        return LogService.writeLog('\nEnd of log....\n\n')
            .then(() => LogService.stopLog())
            .then(() => setLogFile(state, undefined))
            .then(() => ({ logFile: false }));
    };

    action(state: State): Promise<any> {
        if (!Log.canLog(state)) {
            throw new Error('Not allowed from this ID');
        }
        return getLogFile(state) ? Log.stopLog(state) : Log.startLog(state);
    }

    decorate(result: any): void {
        const {
            logFile,
        } = result;
        if (logFile) {
            this.output('Commencing Logging Of Session\n');
            this.output('The log will be written to the file \'mud_log\'\n');
        } else {
            this.output('End of log\n');
        }
    }
}

export class Snoop extends Action {
    private static stopSnoop(state: State, snooped: Player): Promise<any> {
        stopSnoop(state);
        return sendStopSnoop(state, snooped)
            .then(() => ({
                name: snooped.name,
                stopped: true,
            }))
    }

    private static startSnoop(state: State, name: string): Promise<any> {
        return findVisiblePlayer(state, name)
            .then((snooped) => {
                if (!snooped) {
                    throw new Error('Who is that ?');
                }
                if ((!isGod(state) && snooped.isWizard) || !snooped.canBeSnooped) {
                    stopSnoop(state);
                    throw new Error('Your magical vision is obscured');
                }
                startSnoop(state, snooped);
                return Promise.all([
                    Promise.resolve(snooped.name),
                    sendSnoop(state, snooped, getName(state)),
                    touchSnoop(getName(state)),
                ])
            })
            .then(([name]) => ({
                name,
                started: true,
            }));
    }

    private static trySnoop(state: State): Promise<any> {
        return Action.nextWord(state)
            .then(name => (
                name
                    ? Snoop.startSnoop(state, name)
                    : Promise.resolve()
            ));
    }

    action(state: State): Promise<any> {
        if (!isWizard(state)) {
            throw new Error('Ho hum, the weather is nice isn\'t it');
        }
        return getSnooped(state)
            .then(snooped => (
                snooped
                    ? Snoop.stopSnoop(state, snooped)
                    : Snoop.trySnoop(state)
            ));
    }

    decorate(result: any): void {
        const {
            name,
            stopped,
            started,
        } = result;
        if (stopped) {
            this.output(`Stopped snooping on ${name}\n`)
        } else if (started) {
            this.output(`Started to snoop on ${name}\n`);
        }
    }
}