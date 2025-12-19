
import { User, Space, Reservation, Message, BookingStatus } from '../types';
import { INITIAL_USERS, INITIAL_SPACES, INITIAL_AUTHER } from '../data';

// Keys for LocalStorage
const KEYS = {
  USERS: 'user.json',
  SPACES: 'space.json',
  AUTHER: 'auther.json', // Contains reservations and messages
};

interface AutherData {
  reservations: Reservation[];
  messages: Message[];
}

// Helper to read/write
const getJSON = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

const setJSON = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize Data if empty
export const initStorage = () => {
  // 1. Initialize Users
  if (!localStorage.getItem(KEYS.USERS)) {
    setJSON(KEYS.USERS, INITIAL_USERS);
  }

  // 2. Initialize Spaces
  // We always force refresh spaces from the file if the stored count is low (old data)
  const storedSpaces = localStorage.getItem(KEYS.SPACES);
  if (!storedSpaces || JSON.parse(storedSpaces).length < 10) {
    setJSON(KEYS.SPACES, INITIAL_SPACES);
  }

  // 3. Initialize Auther (Reservations & Messages)
  if (!localStorage.getItem(KEYS.AUTHER)) {
    setJSON(KEYS.AUTHER, INITIAL_AUTHER);
  }
};

// --- USERS STORE ---
export const storageUsers = {
  getAll: (): User[] => getJSON(KEYS.USERS, []),
  getByEmail: (email: string): User | undefined => {
    const users = getJSON<User[]>(KEYS.USERS, []);
    return users.find(u => u.email === email);
  },
  create: (user: User) => {
    const users = getJSON<User[]>(KEYS.USERS, []);
    users.push(user);
    setJSON(KEYS.USERS, users);
    return user;
  },
  update: (user: User) => {
    const users = getJSON<User[]>(KEYS.USERS, []);
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      setJSON(KEYS.USERS, users);
    }
    return user;
  }
};

// --- SPACES STORE ---
export const storageSpaces = {
  getAll: (): Space[] => getJSON(KEYS.SPACES, []),
  update: (space: Space) => {
    const spaces = getJSON<Space[]>(KEYS.SPACES, []);
    const index = spaces.findIndex(s => s.id === space.id);
    if (index !== -1) {
      spaces[index] = space;
      setJSON(KEYS.SPACES, spaces);
    }
  }
};

// --- RESERVATIONS STORE ---
export const storageReservations = {
  getAll: (): Reservation[] => {
    const data = getJSON<AutherData>(KEYS.AUTHER, { reservations: [], messages: [] });
    return data.reservations || [];
  },
  add: (res: Reservation) => {
    const data = getJSON<AutherData>(KEYS.AUTHER, { reservations: [], messages: [] });
    data.reservations.push(res);
    setJSON(KEYS.AUTHER, data);
  },
  updateStatus: (id: string, status: BookingStatus) => {
    const data = getJSON<AutherData>(KEYS.AUTHER, { reservations: [], messages: [] });
    const item = data.reservations.find(r => r.id === id);
    if (item) {
      item.status = status;
      setJSON(KEYS.AUTHER, data);
    }
  }
};

// --- MESSAGES STORE ---
export const storageMessages = {
  getAll: (): Message[] => {
    const data = getJSON<AutherData>(KEYS.AUTHER, { reservations: [], messages: [] });
    return data.messages || [];
  },
  add: (msg: Message) => {
    const data = getJSON<AutherData>(KEYS.AUTHER, { reservations: [], messages: [] });
    data.messages.push(msg);
    setJSON(KEYS.AUTHER, data);
  }
};
