import React from "react";
import Logo from "../public/favicon.svg";
import Video from "./video";
import "./app.css";

const App = () => (
  <main>
    <header>
      <img src={Logo} alt="WebbyLab" />
      <h1>Hawk AI</h1>
    </header>
    <Video />
  </main>
);

export default App;
