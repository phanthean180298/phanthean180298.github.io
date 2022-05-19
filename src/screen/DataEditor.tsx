import { useCallback, useEffect, useRef, useState } from "react";

import Editor from "@monaco-editor/react";
import "../index.css";
import { dataHelper } from "../util/dataHelper";

function DataEditor() {
  const ref: any = useRef(null);
  const [scriptName, setScriptName] = useState("default");
  const [value, setValue] = useState("");
  const [data, setData]: any = useState([])
  const [language, setLanguage] = useState('text')

  const download = useCallback(() => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(value));
    element.setAttribute('download', scriptName);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);

  }, [scriptName, value])

  const init = useCallback(async () => {
    const folderTree = await dataHelper.getData()
    setData(folderTree || [])
  }, [])

  useEffect(() => {
    init()
  }, [init])


  const onChangeFile = useCallback((item: any) => {
    setScriptName(item.name)
    if (item.name && item.name.endsWith('.json')) {
      setLanguage('json')
    } else {
      setLanguage('text')
    }
  }, [])

  const save = useCallback(() => {
    const file = data.find((file: any) => file.name === scriptName);

    setData(data.map((f: any) => {
      if (f.name === scriptName) {
        return { ...file, data: value };
      }
      return f
    }))

    dataHelper.saveFile(file, value)
  }, [data, scriptName, value])

  return (
    <div className="screen">
      <div className="navigation">
        <button onClick={download}>Download</button>
        <button onClick={save}>Save</button>
      </div>
      <div className="content">
        <div
          style={{
            backgroundColor: "#d9d9d9",
            display: "flex",
            flex: 1,
            flexDirection: "column",
            height: "100%",
          }}
        >
          {data.map((item: any) => (
            <div
              key={item.name}
              style={{ paddingLeft: 30 * item.level, fontSize: 20 }}
            >
              <button
                onClick={() => onChangeFile(item)}>
                {item.name}
              </button>
            </div>
          ))}
        </div>
        <Editor
          defaultValue="...some comment"
          onChange={(_value, ev) => {
            setValue(_value!);
          }}
          language={language}
          onMount={(editor) => {
            ref.current = editor;
          }}
          value={
            data.find((file: File) => file.name === scriptName)?.data || '...some comment'
          }
        />
      </div>
    </div>
  );
}


export default DataEditor