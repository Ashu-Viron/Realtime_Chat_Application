const STORAGE_KEYS = {
  USERNAME: 'chat-username',
  CURRENT_ROOM: 'chat-current-room',
  ROOMS: 'chat-rooms',
} as const;

export const storage = {
  getUsername: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.USERNAME);
  },

  setUsername: (username: string): void => {
    localStorage.setItem(STORAGE_KEYS.USERNAME, username);
  },

  getCurrentRoom: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM);
  },

  setCurrentRoom: (room: string): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, room);
  },

  getRooms: (): string[] => {
    const rooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return rooms ? JSON.parse(rooms) : ['general', 'random'];
  },

  addRoom: (room: string): void => {
    const rooms = storage.getRooms();
    if (!rooms.includes(room)) {
      rooms.push(room);
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    }
  },
};