# TaskApp - Productivity Assistant

A comprehensive task management application built with React Native and Expo, featuring AI-powered productivity insights and advanced task management capabilities.

## Features

- **Task Management**: Create, edit, and organize tasks with priority levels and deadlines
- **Smart Categories**: Organize tasks into categories with visual indicators
- **Time Tracking**: Track time spent on tasks with built-in timer functionality
- **Calendar Integration**: Sync tasks with your device calendar
- **AI-Powered Insights**: Get productivity analysis and recommendations
- **Smart Assistant**: Interact with an AI assistant for productivity advice
- **Dark Mode**: Full support for light and dark themes
- **Push Notifications**: Get reminders for upcoming tasks
- **Productivity Analytics**: View charts and stats about your task completion patterns

## Screenshots

<div style="display: flex; flex-direction: row; flex-wrap: wrap;">
  <img src="screenshots/home-screen.png" width="250" alt="Home Screen" />
  <img src="screenshots/task-detail.png" width="250" alt="Task Detail" />
  <img src="screenshots/analytics.png" width="250" alt="Analytics" />
  <img src="screenshots/smart-assistant.png" width="250" alt="Smart Assistant" />
  <img src="screenshots/calendar.png" width="250" alt="Calendar View" />
</div>

## Tech Stack

- **React Native**: Core framework for building the mobile app
- **Expo**: Development platform for simplified native app development
- **TypeScript**: For type-safe code
- **React Navigation**: For navigation between screens
- **Expo Calendar**: For calendar integration
- **Expo Notifications**: For push notifications
- **Expo Image Picker**: For profile image selection
- **React Native Reanimated**: For smooth animations
- **Date-fns**: For date manipulation
- **AsyncStorage**: For local data persistence

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/taskapp.git
cd taskapp
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Run on a device or emulator:
   - Press `a` to run on Android emulator
   - Press `i` to run on iOS simulator
   - Scan the QR code with the Expo Go app on your physical device

### Environment Configuration

For AI functionality, you need to set up your API keys in `src/config/env.ts`:

```typescript
export default {
  AI: {
    apiKey: 'your-api-key-here',
    enabled: true,
  },
  APP: {
    version: '1.0.0',
    name: 'TaskApp',
  }
};
```

## Project Structure

