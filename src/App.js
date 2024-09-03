import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
// import Join from "./component/join";
// import Chat from "./component/chat";
import Test from "./component/Chat/test";
import Signup from "./component/auth/signup";
import Login from "./component/auth/login";
import UserFetch from "./component/userFetch";
import UserComponent from "./component/user/userprofile";
import { useContext } from 'react';
import { UserContext } from './component/context/user';
function App() {
  const { user } = useContext(UserContext);
  return (
    <BrowserRouter>
      <UserFetch />
      <Routes>
        {user && (
          <Route
            exact
            path={process.env.REACT_APP_BASE_URL + '/profile'}
            element={<UserComponent user={user} />}
          />
        )}
        {/* <Route exact path="/" element={<Join />} /> */}
        {/* <Route exact path="/chat" element={<Chat />} /> */}
        <Route exact path="/test" element={<Test />} />
        <Route exact path={process.env.REACT_APP_BASE_URL + "/signup"} element={<Signup />} />
        <Route exact path={process.env.REACT_APP_BASE_URL + "/login"} element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
