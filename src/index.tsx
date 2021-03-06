import {
  createBatch,
  createGameLoop,
  createStage,
  createViewport,
  Game,
} from "gdxjs";
import createTitleScreen from "./screen/createTitleScreen";


import React, { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client';
import DataEditor from "./screen/DataEditor";

const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 1000;

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();
  const viewport = createViewport(canvas, WORLD_WIDTH, WORLD_HEIGHT);
  const gl = viewport.getContext();
  const camera = viewport.getCamera();

  const batch = createBatch(gl);

  const game = new Game<void>();

  game.setScreen(await createTitleScreen(game, viewport));

  createGameLoop((delta: any) => {
    game.update(delta);
    batch.setProjection(camera.combined);
    batch.begin();
    batch.end();
  });
};


const App = () => {
  const [showEditor, setShowEditor] = useState(false)
  const [inited, setInited] = useState(false)
  const [rootZIndex, setRootZIndex] = useState(-1)

  const escFunction = useCallback((event: any) => {
    if (event.keyCode === 27) {
      setShowEditor(!showEditor)
    }
  }, [showEditor]);

  useEffect(() => {
    document.addEventListener("keydown", escFunction);

    return () => {
      document.removeEventListener("keydown", escFunction);
    };
  }, [escFunction]);

  useEffect(() => {
    if (!showEditor) {
      init()
      setRootZIndex(-1)
      setInited(true)
    } else {
      setRootZIndex(1)
    }
  }, [showEditor, inited])

  return (<div style={{ zIndex: rootZIndex, display: 'flex', flex: 1 }}>
    {showEditor && <DataEditor />}
  </div>)
}


const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);