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
import Protectedlogin from "./component/private/Protectedlogin";
import PrivateRoute from "./component/private/PrivateRoute";
import VoiceCall from "./component/call/voiceCall";
function App() {
  const { user } = useContext(UserContext);
  return (
    <BrowserRouter>
      <UserFetch />
      <Routes>
        {/* <Route exact path="/" element={<Join />} /> */}
        {/* <Route exact path="/chat" element={<Chat />} /> */}
        <Route element={<PrivateRoute />}>
          <Route exact path={'/'} element={<Test />} />
          {/* {user && ( */}
          <Route
            exact
            path={process.env.REACT_APP_BASE_URL + '/profile'}
            element={<UserComponent user={user} />}
          />
          {/* )} */}
          <Route exact path={process.env.REACT_APP_BASE_URL + "/call"} element={<VoiceCall />} />
        </Route>
        <Route element={<Protectedlogin />}>
          <Route exact path={process.env.REACT_APP_BASE_URL + "/signup"} element={<Signup />} />
          <Route exact path={process.env.REACT_APP_BASE_URL + "/login"} element={<Login />} />
        </Route>
        <Route path="*" element={<p>There's nothing here: 404!</p>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
