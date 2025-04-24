import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Search from "./pages/Search";   
import Profile from "./pages/Profile";
import LogWorkout from "./pages/LogWorkout";
import Groups from "./pages/Groups";
import Layout from "./components/Layout";
import GroupProfile from "./pages/GroupProfile";
import UserProfile from "./pages/UserProfile";
import NewGroup from "./pages/NewGroup";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/search" element={<Search />} />
          <Route path="/log-workout" element={<LogWorkout />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/groups/new" element={<NewGroup />} />
          <Route path="/groups/:id" element={<GroupProfile />} />
          <Route path="/users/:id" element={<UserProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
