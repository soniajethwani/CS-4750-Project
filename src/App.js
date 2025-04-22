import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Search from "./pages/Search";   
import Profile from "./pages/Profile";
import LogWorkout from "./pages/LogWorkout";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/search" element={<Search />} />
          <Route path="/log-workout" element={<LogWorkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<div>Search coming soon…</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
