# CINEMX Watch Party Documentation

## Overview

The Watch Party feature allows multiple users to watch the same movie simultaneously with synchronized playback and interactive features like chat, reactions, and participant management. This document outlines the architecture, components, and usage of the Watch Party system.

## Architecture

### Client-Server Model

The Watch Party system uses a client-server architecture with Socket.IO for real-time communication:

1. **Server**: Socket.IO server handling party management, participant tracking, and synchronization events
2. **Client**: React components using Socket.IO client to connect to the server and render the UI

### Key Components

- **`useWatchParty` Hook**: Core state management and socket communication
- **`WatchPartyOverlay`**: UI component for chat, participants, and controls
- **`VideoPlayer`**: Enhanced with synchronization capabilities
- **`JoinPartyButton`**: Component for discovering and joining active parties

## Host-Member Synchronization Model

### Host-Driven Control Flow

The Watch Party uses a strict host-driven control model:

```
┌─────────┐       ┌─────────────┐       ┌──────────┐
│   Host  │──────▶│ Socket.IO   │──────▶│ Members  │
│         │       │   Server    │       │          │
└─────────┘       └─────────────┘       └──────────┘
     │                                        │
     │                                        │
     ▼                                        ▼
┌─────────┐                            ┌──────────┐
│ Video   │                            │ Video    │
│ Controls│                            │ Locked   │
└─────────┘                            └──────────┘
```

1. **Host Actions**:
   - Can play, pause, seek, and control video
   - Sends sync events to server
   - Controls party lifecycle

2. **Member Actions**:
   - Cannot directly control video
   - Receives sync events from server
   - Applies host's playback state

### Synchronization Protocol

The synchronization protocol ensures all members stay in sync with the host:

1. **Initial Sync**: When a member joins, they receive the current playback state
2. **Continuous Sync**: Host sends updates during playback at regular intervals
3. **Event-Based Sync**: Immediate sync on play/pause/seek events
4. **Throttling**: Updates are throttled to prevent network congestion
5. **Conflict Resolution**: Member-initiated controls are blocked

## Socket Events

| Event                | Direction       | Description                       |
| -------------------- | --------------- | --------------------------------- |
| `watch-party-joined` | Server → Client | Sent when a client joins a party  |
| `participant-joined` | Server → Client | Sent when a new participant joins |
| `participant-left`   | Server → Client | Sent when a participant leaves    |
| `video-sync`         | Bidirectional   | Synchronizes video playback state |
| `send-message`       | Client → Server | Sends a chat message              |
| `new-message`        | Server → Client | Broadcasts a new chat message     |
| `send-reaction`      | Client → Server | Sends an emoji reaction           |
| `new-reaction`       | Server → Client | Broadcasts a new reaction         |

## Component Usage

### useWatchParty Hook

```tsx
const { isConnected, participants, syncVideo, sendMessage, sendReaction } = useWatchParty({
  partyId: 'party-id',
  nickname: 'User',
  userId: 'user-id',
  isHost: true,
  onVideoSync: (data) => {
    // Handle sync data
  },
});
```

### WatchPartyOverlay Component

```tsx
<WatchPartyOverlay
  partyId="party-id"
  nickname="User"
  movieTitle="Movie Title"
  isHost={true}
  onLeaveParty={() => {
    // Handle leave party
  }}
/>
```

### JoinPartyButton Component

```tsx
<JoinPartyButton movieId="movie-id" slug="movie-slug" className="mt-4" />
```

## Known Limitations

1. **Network Dependency**: Synchronization quality depends on network conditions
2. **Browser Autoplay Policies**: Initial autoplay may be blocked by browsers
3. **Scalability**: Current implementation works best with small to medium-sized parties
4. **Mobile Support**: Limited support for mobile devices due to autoplay restrictions

## Troubleshooting

### Common Issues

1. **Desynchronization**: If videos become out of sync:
   - Host can pause and play to force resynchronization
   - Members can refresh the page to rejoin

2. **Connection Issues**:
   - Check network connectivity
   - Server may be under high load
   - Socket connection may be blocked by firewall

3. **Duplicate Participants**:
   - Fixed with unique participant tracking
   - May occur if same user joins from multiple tabs

## Future Improvements

1. **Advanced Party Management**:
   - Transferable host role
   - Participant permissions
   - Scheduled parties

2. **Enhanced Synchronization**:
   - Buffer-based synchronization
   - Network quality adaptation
   - Latency compensation

3. **UI Enhancements**:
   - Customizable layouts
   - Picture-in-picture chat
   - Audio chat support
