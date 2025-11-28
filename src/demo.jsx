import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import PerdanaDraggableList from './index'

const initData = [
  { id: "item-1", title: "Item 1", description: "Board 1 Item 1", isEditing: false },
  { id: "item-2", title: "Item 2", description: "Board 1 Item 2", isEditing: false },
  { id: "item-3", title: "Item 3", description: "Board 1 Item 3", isEditing: false },
  { id: "item-4", title: "Item 4", description: "Board 1 Item 4", isEditing: false },
];
const App = () => {
  const [data, setData] = useState(initData)

  return (
    <div
      style={{
        maxWidth: 800,
        margin: '60px auto',
        fontFamily: 'sans-serif',
        padding: '0 16px',
        height: '100vh'
      }}
    >
      <h1 style={{paddingTop: 100}}>Perdana Draggable List Demo</h1>
        <PerdanaDraggableList
          data={data}
          onDragStart={(i) => console.log("start", i)}
          onDragEnd={(start, end, next) => setData(next)}
        />
    </div>
  )
}

const container = document.getElementById('root')
const root = createRoot(container)
root.render(<App />)
