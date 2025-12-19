import { usersData } from './users';
import { spacesData } from './spaces';
import { reservationsData } from './reservations';
import { messagesData } from './messages';

export const INITIAL_USERS = usersData;
export const INITIAL_SPACES = spacesData;
export const INITIAL_AUTHER = {
    reservations: reservationsData,
    messages: messagesData
};
