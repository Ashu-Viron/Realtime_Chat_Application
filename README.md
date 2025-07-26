```md
# 📡 Real-Time Chat Application

This is a real-time chat application built using **WebSocket** architecture with a **Relayer Server** and **User WebSocket Server**. It supports **room-based messaging**, allowing users to join specific chat rooms and receive only relevant messages.

---

## 🗂️ Project Structure

```
.
├── relayer-ws        # Relayer WebSocket Server (broadcasts to all user-ws)
│   └── index.ts
├── user-ws           # User WebSocket Server (handles client room connections)
│   └── index.ts
├── fe                # Frontend (Not included in this repo structure)
├── node_modules      # Node dependencies
├── .git              # Git repo
```

---

## 🚀 Getting Started

### 1. Install Dependencies

Go to both `relayer-ws` and `user-ws` folders and run:

```bash
npm install
```

Or if you're using `yarn`:

```bash
yarn install
```

---

### 2. Start the Relayer Server

```bash
cd relayer-ws
node index.ts
```

This will start the **relayer WebSocket server** at `ws://localhost:3001`.

---

### 3. Start the User WebSocket Server

```bash
cd user-ws
node index.ts
```

This will start the **user-facing WebSocket server** at `ws://localhost:8080`.

---

### 4. Frontend Setup (Optional)

The frontend should:

- Connect to `ws://localhost:8080`
- Send a message like:

```json
{ "type": "join-room", "room": "room-1" }
```

- Then send chat messages:

```json
{ "type": "chat", "room": "room-1", "sender": "Ashutosh", "message": "Hello world!" }
```

- It will receive messages broadcasted to the same room via the relayer.

---

## ⚙️ How It Works

- **Clients** connect to the `user-ws` server.
- Clients **join rooms**.
- When someone sends a `"chat"` message, `user-ws` forwards it to `relayer-ws`.
- `relayer-ws` broadcasts the message to **all `user-ws` servers**.
- Each `user-ws` then **forwards the message to all clients in the same room**.

---

## ✅ Features

- WebSocket-based real-time communication  
- Room-based architecture  
- Modular relayer layer (can be scaled to multiple nodes)  
- Simple and extendable  

---

## 🛠️ TODO

- Add authentication & validation  
- Add persistent chat storage (MongoDB, Redis, etc.)  
- Frontend UI  
- Unit tests  

---

## 🧑‍💻 Author

**Ashutosh Raj**  
Built with ❤️ using TypeScript + WebSocket
```
