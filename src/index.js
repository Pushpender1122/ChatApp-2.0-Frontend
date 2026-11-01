import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { UserProvider } from './component/context/user';
import { SocketProvider } from './component/context/socketContext';
import { ChatUserProvider } from './component/context/chatUser';
import { ThemeProvider } from './component/context/theme';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <ThemeProvider>
  <SocketProvider>
    <ChatUserProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </ChatUserProvider>
  </SocketProvider>
  </ThemeProvider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
