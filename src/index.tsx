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


import React, { ReactNode, useRef, useState } from "react";
import ReactDOM from "react-dom";

import Editor from "@monaco-editor/react";
import { dataHelper } from "./util/dataHelper";
import './index.css'

const initTreeState = [
  { name: 'data', level: 1 },
  { name: 'map', level: 2, parent: 'data' },
  { name: 'formula', level: 2, parent: 'data' },
  { name: 'items.txt', level: 3, parent: 'formula', isFile: true, url: 'data/formula/items.txt' },
  { name: 'tools.txt', level: 3, parent: 'formula', isFile: true, url: 'data/formula/tools.txt' }
];



function App() {
  const [value, setValue] = useState("// some comment")


  return (
    <div className="content">
      <div style={{ backgroundColor: '#787171', display: 'flex', flex: 1, flexDirection: 'column' }}>
        {initTreeState.map(item =>
        (<div style={{ paddingLeft: 30 * item.level }}>
          <button onClick={() => dataHelper.getTxt(item && item.url || 'data/formula/items.txt').then(value => { if (value) setValue(value) })}>{item.name}</button>
        </div>))}
      </div>

      <Editor
        height="90vh"
        defaultLanguage="json"
        value={value}
        onChange={(_value, ev) => setValue(value)}
      />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);