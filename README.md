# Finora - AI-Powered Finance Management Platform

A full-stack finance management web application built with React, Node.js, MongoDB, and integrated with AI capabilities using Google Gemini API.

## 🚀 Tech Stack

### Frontend
- **React.js** - UI library
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

### Integrations
- **JWT** - Authentication
- **Google Gemini API** - AI features
- **Cloudinary** - File storage

## 📁 Project Structure

```
finora/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   ├── utils/              # Utility functions
│   └── server.js           # Server entry point
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Finora
   ```

2. **Install client dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd ../server
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret
   - Google Gemini API key
   - Cloudinary credentials

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:5000`

2. **Start the frontend (in a new terminal)**
   ```bash
   cd client
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

## 📝 Available Scripts

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Server
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🔐 Environment Variables

See `server/.env.example` for all required environment variables.

## 📄 License

ISC

## 👥 Contributors

Add your name here

