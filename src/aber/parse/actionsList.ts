import Action from "../action";
import {
    DefaultAction,
    GoDirection, Quit,
} from "./actions";
import {searchList, SearchResult} from "./helpers";
import {Grope} from "../new1/actions";

const NORTH = 0;
const EAST = 1;
const SOUTH = 2;
const WEST = 3;
const UP = 4;
const DOWN = 5;

const actions = {
    // Directions
    'go': new GoDirection(),
    'climb': new GoDirection(),
    'n': new GoDirection(NORTH),
    'e': new GoDirection(EAST),
    's': new GoDirection(SOUTH),
    'w': new GoDirection(WEST),
    'u': new GoDirection(UP),
    'd': new GoDirection(DOWN),
    'north': new GoDirection(NORTH),
    'east': new GoDirection(EAST),
    'south': new GoDirection(SOUTH),
    'west': new GoDirection(WEST),
    'up': new GoDirection(UP),
    'down': new GoDirection(DOWN),

    //
    'quit': new Quit(8),
    'get': new DefaultAction(9),
    'take': new DefaultAction(9),
    'drop': new DefaultAction(10),

    'look': new DefaultAction(11),
    'i': new DefaultAction(12),
    'inv': new DefaultAction(12),
    'inventory': new DefaultAction(12),
    'who': new DefaultAction(13),
    'reset': new DefaultAction(14),
    'zap': new DefaultAction(15),
    'eat': new DefaultAction(16),
    'drink': new DefaultAction(16),
    'play': new DefaultAction(17),
    'shout': new DefaultAction(18),
    'say': new DefaultAction(19),
    'tell': new DefaultAction(20),

    'save': new DefaultAction(21),
    'score': new DefaultAction(22),
    'exorcise': new DefaultAction(23),
    'give': new DefaultAction(24),
    'steal': new DefaultAction(25),
    'pinch': new DefaultAction(25),
    'levels': new DefaultAction(26),
    'help': new DefaultAction(27),
    'value': new DefaultAction(28),
    'stats': new DefaultAction(29),
    'examine': new DefaultAction(30),
    'read': new DefaultAction(30),

    'delete': new DefaultAction(31),
    'pass': new DefaultAction(32),
    'password': new DefaultAction(33),
    'summon': new DefaultAction(34),
    'weapon': new DefaultAction(35),
    'shoot': new DefaultAction(35),
    'kill': new DefaultAction(35),
    'hit': new DefaultAction(35),
    'fire': new DefaultAction(35),
    'launch': new DefaultAction(35),
    'smash': new DefaultAction(35),
    'break': new DefaultAction(35),

    'laugh': new DefaultAction(50),

    'cry': new DefaultAction(51),
    'burp': new DefaultAction(52),
    'fart': new DefaultAction(53),
    'hiccup': new DefaultAction(54),
    'grin': new DefaultAction(55),
    'smile': new DefaultAction(56),
    'wink': new DefaultAction(57),
    'snigger': new DefaultAction(58),
    'pose': new DefaultAction(59),
    'set': new DefaultAction(60),

    'pray': new DefaultAction(61),
    'storm': new DefaultAction(62),
    'rain': new DefaultAction(63),
    'sun': new DefaultAction(64),
    'snow': new DefaultAction(65),
    'goto': new DefaultAction(66),

    'wear': new DefaultAction(100),

    'remove': new DefaultAction(101),
    'put': new DefaultAction(102),
    'wave': new DefaultAction(103),
    'blizzard': new DefaultAction(104),
    'open': new DefaultAction(105),
    'close': new DefaultAction(106),
    'shut': new DefaultAction(106),
    'lock': new DefaultAction(107),
    'unlock': new DefaultAction(108),
    'force': new DefaultAction(109),
    'light': new DefaultAction(110),

    'extinguish': new DefaultAction(111),
    'where': new DefaultAction(112),
    'turn': new DefaultAction(117),
    'invisible': new DefaultAction(114),
    'visible': new DefaultAction(115),
    'pull': new DefaultAction(117),
    'press': new DefaultAction(117),
    'push': new DefaultAction(117),
    'cripple': new DefaultAction(118),
    'cure': new DefaultAction(119),
    'dumb': new DefaultAction(120),

    'change': new DefaultAction(121),
    'missile': new DefaultAction(122),
    'shock': new DefaultAction(123),
    'fireball': new DefaultAction(124),
    'translocate': new DefaultAction(125),
    'blow': new DefaultAction(126),
    'sigh': new DefaultAction(127),
    'kiss': new DefaultAction(128),
    'hug': new DefaultAction(129),
    'slap': new DefaultAction(130),

    'tickle': new DefaultAction(131),
    'scream': new DefaultAction(132),
    'bounce': new DefaultAction(133),
    'wiz': new DefaultAction(134),
    'stare': new DefaultAction(135),
    'exits': new DefaultAction(136),
    'crash': new DefaultAction(137),
    'sing': new DefaultAction(138),
    'grope': new Grope(139),
    'spray': new DefaultAction(140),

    'groan': new DefaultAction(141),
    'moan': new DefaultAction(142),
    'directory': new DefaultAction(143),
    'yawn': new DefaultAction(144),
    'wizlist': new DefaultAction(145),
    'in': new DefaultAction(146),
    'smoke': new DefaultAction(147),
    'deafen': new DefaultAction(148),
    'resurrect': new DefaultAction(149),
    'log': new DefaultAction(150),

    'tss': new DefaultAction(151),
    'rmedit': new DefaultAction(152),
    'loc': new DefaultAction(153),
    'squeeze': new DefaultAction(154),
    'users': new DefaultAction(155),
    'honeyboard': new DefaultAction(156),
    'inumber': new DefaultAction(157),
    'update': new DefaultAction(158),
    'become': new DefaultAction(159),
    'systat': new DefaultAction(160),

    'converse': new DefaultAction(161),
    'snoop': new DefaultAction(162),
    'shell': new DefaultAction(163),
    'raw': new DefaultAction(164),
    'purr': new DefaultAction(165),
    'cuddle': new DefaultAction(166),
    'sulk': new DefaultAction(167),
    'roll': new DefaultAction(168),
    'credits': new DefaultAction(169),
    'brief': new DefaultAction(170),

    'debug': new DefaultAction(171),
    'jump': new DefaultAction(172),
    'wield': new DefaultAction(34),
    'map': new DefaultAction(173),
    'flee': new DefaultAction(174),
    'bug': new DefaultAction(175),
    'typo': new DefaultAction(176),
    'pn': new DefaultAction(177),
    'blind': new DefaultAction(178),
    'patch': new DefaultAction(179),
    'debugmode': new DefaultAction(180),

    'pflags': new DefaultAction(181),
    'frobnicate': new DefaultAction(182),
    'strike': new DefaultAction(35),
    'setin': new DefaultAction(183),
    'setout': new DefaultAction(184),
    'setmin': new DefaultAction(185),
    'setmout': new DefaultAction(186),
    'emote': new DefaultAction(187),
    'dig': new DefaultAction(188),
    'empty': new DefaultAction(189),
};

const getAction = (action: SearchResult): Action => action.item || new DefaultAction(action.itemId);

const searchAction = (action: string): Promise<Action> => searchList(action.toLowerCase(), actions)
    .catch(() => Promise.reject(new Error('I don\'t know that verb')))
    .then(getAction);

export default searchAction;
