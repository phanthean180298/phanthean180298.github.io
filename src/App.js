import logo from "./logo.svg";
import "./App.css";
import { useCallback, useState } from "react";

const text = "De 68 00 03x2500n.00 06 09 10 11x2800n.12 13 14 92x400n.tin2";

const sample = [];
for (let i = 0; i < 100; i++) {
  sample.push(0);
}

const translateText = (value, result) => {
  let data1 = value.split(".");
  data1.pop();

  for (let i = 0; i < data1.length; i++) {
    data1[i] = data1[i].replace("De ", "");
    const parseData = data1[i].split("x");
    const point = Number(parseData[1].replace("n", ""));
    const target = parseData[0].split(" ");
    for (let x = 0; x < target.length; x++) {
      result[Number(target[x])] += point;
    }
  }
  return result;
};

// translateText(text);

function App() {
  const [input, setInput] = useState("");
  const [array, setArray] = useState(sample);
  const [sum, setSum] = useState(0);

  const process = useCallback(() => {
    const _array = array.concat();
    const data = translateText(input, _array);
    const _sum = data.reduce((partialSum, a) => partialSum + a, 0);
    setArray(data);
    setSum(_sum);
    setInput("");
  }, [array, input]);

  const _handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        process();
      }
    },
    [process]
  );

  return (
    <div
      className="App"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <input
          type="text"
          id="fname"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={_handleKeyDown}
        ></input>
        <button type="submit" style={{ marginLeft: 20 }} onClick={process}>
          Nhập
        </button>
        <button
          style={{ margin: 20 }}
          onClick={() => {
            console.log(111);
            setSum(0);
            setArray(sample);
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ paddingBottom: 20 }}>Tổng số điểm: {sum}</div>
      <table id="customers">
        <thead>
          <tr>
            <th style={{ paddingRight: 40 }}>Số</th>
            <th>Điểm</th>
          </tr>
        </thead>
        <tbody>
          {array.map((value, index) => (
            <tr key={`${index}_${value}`}>
              <td style={{ paddingRight: 40 }}>
                {index > 9 ? index : `0${index}`}
              </td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
