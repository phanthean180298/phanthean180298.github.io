// import {
//   createBatch,
//   createGameLoop,
//   createStage,
//   createViewport,
//   Game,
// } from "gdxjs";
// import createTitleScreen from "./screen/createTitleScreen";

// const WORLD_WIDTH = 600;
// const WORLD_HEIGHT = 1000;

// const init = async () => {
//   const stage = createStage();
//   const canvas = stage.getCanvas();
//   const viewport = createViewport(canvas, WORLD_WIDTH, WORLD_HEIGHT);
//   const gl = viewport.getContext();
//   const camera = viewport.getCamera();

//   const batch = createBatch(gl);

//   const game = new Game<void>();

//   game.setScreen(await createTitleScreen(game, viewport));

//   createGameLoop((delta: any) => {
//     game.update(delta);
//     batch.setProjection(camera.combined);
//     batch.begin();
//     batch.end();
//   });
// };

// init();


import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";

import Editor from "@monaco-editor/react";
import { dataHelper } from "./util/dataHelper";
import './index.css'



const initTreeState = [
  { name: 'map', level: 1, parent: 'data' },
  { name: 'formula', level: 1, parent: 'data' },
  { name: 'items.txt', level: 2, parent: 'formula', isFile: true, url: 'data/formula/items.txt' },
  { name: 'tools.txt', level: 2, parent: 'formula', isFile: true, url: 'data/formula/tools.txt' }
];

function App() {
  const ref: any = useRef(null)
  const [scriptName, setScriptName] = useState("...some comment")
  const [value, setValue] = useState("")

  return (
    <div className="screen">
      <div className="navigation">
        <button>Reset</button>
        <button>Download</button>
      </div>
      <div className="content">
        <div style={{ backgroundColor: '#d9d9d9', display: 'flex', flex: 1, flexDirection: 'column', height: '100%' }}>
          {initTreeState.map(item =>
          (<div key={item.name} style={{ paddingLeft: 30 * item.level, fontSize: 20 }}>
            <button onClick={() => dataHelper.getTxt(item.url || 'data/formula/items.txt').then(_value => {
              if (_value) {
                setScriptName(item.name)
              }
            })}>{item.name}</button>
          </div>))}
        </div>

        <Editor
          defaultValue="...some comment"
          onChange={(_value, ev) => {
            setValue(_value!)
          }}
          onMount={(editor) => {
            ref.current = editor;
          }}
        />
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);