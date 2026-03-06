import { useState } from "react";
import { MonacoEditor } from "./MonacoEditor";
import "./App.css";

function App() {
  const [code, setCode] = useState(`// Tauri + Monaco 基础示例
function hello() {
  console.log("Hello from Monaco Editor!");
}
hello();
`);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tauri + Monaco</h1>
        <p>桌面端代码编辑器基础示例</p>
      </header>
      <main className="app-main">
        <MonacoEditor
          value={code}
          language="javascript"
          theme="vs-dark"
          onChange={setCode}
          height="calc(100vh - 140px)"
        />
      </main>
    </div>
  );
}

export default App;
