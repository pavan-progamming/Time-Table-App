# 🎓 University Timetable Manager

A modern, mobile-first application for managing your university schedule, tasks, and deadlines. Built with React and Capacitor for a seamless cross-platform experience.

## ✨ Features

### 📅 Timetable Management
- Weekly class schedule with color-coded subjects
- Daily and weekly calendar views
- Intuitive drag-and-drop interface
- Quick add/edit/delete classes

### ✅ Task & Assignment Tracker
- Create and organize tasks by subject
- Set due dates and priority levels
- Visual progress tracking
- Local notifications for upcoming deadlines

### 📱 Mobile Optimized
- Native mobile experience with Capacitor
- Works offline with local data persistence
- Custom app icon and splash screen
- Responsive design for all screen sizes

### 📊 Reports & Analytics
- Weekly study time tracking
- Subject-wise time allocation
- Task completion statistics
- Exportable reports

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

```bash
# Clone the repository
git clone https://github.com/pavan-progamming/Time-Table-App.git
cd Time-Table-Appt/frontend

# Install dependencies
npm install
```

## 🛠 Development

### Running in Web Browser
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) to view in your browser.

### Building for Mobile (Android)
```bash
# Build the React app
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

### Building for Mobile (iOS)
```bash
# Build the React app
npm run build

# Sync with Capacitor
npx cap sync ios

# Open in Xcode
npx cap open ios
```

## 🏗 Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React context providers
│   ├── pages/          # Main application pages
│   │   ├── Dashboard.js
│   │   ├── Timetable.js
│   │   ├── Reports.js
│   │   ├── Settings.js
│   │   └── Welcome.js
│   ├── services/       # API and service layer
│   ├── styles/         # Global styles and themes
│   ├── utils/          # Utility functions
│   ├── App.js          # Main application component
│   └── index.js        # Application entry point
├── android/            # Android platform code
└── public/             # Static assets
```

## 🛠 Tech Stack

- **Frontend**: React 19, React Router 7
- **State Management**: React Context API
- **UI Components**: Custom components with CSS
- **Icons**: Lucide Icons
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Notifications**: Capacitor Local Notifications
- **Build Tool**: Create React App

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

pavan kumar -  pavankumarrallapati9182@gmail.com

Project Link: https://github.com/pavan-progamming/Time-Table-App.git
