import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import BurgerMenuIcon from "./icons/BurgerMenuIcon";

const defaultCardHeight = 90;
const initialDragInfo = { activeIndex: -1, startY: 0, startTop: 0, dragTop: null };

const arraysEqual = (a = [], b = []) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const moveItem = (list, from, to, fallback) => {
  if (!Array.isArray(list) || from === to || !list.length) return list ?? [];
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved ?? fallback);
  return next;
};

const measureHeights = (nodes) =>
  Array.from(nodes).map((node) => Math.round(node.getBoundingClientRect().height));

/**
 * React version of the single-board drag-and-drop component.
 *
 * @param {Object} props
 * @param {Array<{id: string, title: string, description: string}>} props.data
 * @param {number} [props.gap=0]
 * @param {(startIndex: number) => void} [props.onDragStart]
 * @param {(startIndex: number, endIndex: number, nextData: Array<Object>) => void} [props.onDragEnd]
 * @param {(index: number, item: data) => void} [props.renderItem]
 * @param {() => React.ReactElement} [props.renderHandleIcon]
 * @param {string} [props.containerClassName]
 * @param {string} [props.cardItemClassName]
 */
function PerdanaDraggableList({
  gap = 12,
  data = [],
  onDragStart,
  onDragEnd,
  renderItem,
  renderHandleIcon,
  containerClassName,
  cardItemClassName,
}) {
  const containerRef = useRef(null);

  const [items, setItems] = useState(() => [...data]);
  const [cardHeights, setCardHeights] = useState(() => data.map(() => defaultCardHeight));
  const [dragInfo, setDragInfo] = useState({ ...initialDragInfo });

  // Refs keep window listeners in sync without re-registering.
  const dragInfoRef = useRef(dragInfo);
  const itemsRef = useRef(items);
  const cardHeightsRef = useRef(cardHeights);
  const slotTopsRef = useRef([]);

  useEffect(() => {
    setItems([...data]);
    setCardHeights((prev) => {
      const next = data.map((_, index) => prev[index] ?? defaultCardHeight);
      console.log({next})
      return arraysEqual(prev, next) ? prev : next;
    });
  }, [data]);

  useEffect(() => {
    dragInfoRef.current = dragInfo;
  }, [dragInfo]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    cardHeightsRef.current = cardHeights;
  }, [cardHeights]);

  useLayoutEffect(() => {
    if (!containerRef.current || dragInfo.activeIndex !== -1) return;
    const nodes = containerRef.current.querySelectorAll(".pg-card");
    if (!nodes.length) return;

    const measuredHeights = measureHeights(nodes);
    setCardHeights((prev) => (arraysEqual(prev, measuredHeights) ? prev : measuredHeights));
  }, [items, dragInfo.activeIndex]);

  useEffect(() => {
    if (dragInfo.activeIndex === -1) return undefined;

    const handleWindowMouseMove = (event) => handleMouseMove(event);
    const handleWindowMouseUp = () => handleMouseUp();

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [dragInfo.activeIndex]);

  const slotTops = useMemo(() => {
    const tops = [];
    let offset = gap;
    for (let i = 0; i < items.length; i += 1) {
      const height = cardHeights[i] ?? defaultCardHeight;
      tops.push(offset);
      offset += height + gap;
    }
    return tops;
  }, [items.length, gap, cardHeights]);

  useEffect(() => {
    slotTopsRef.current = slotTops;
  }, [slotTops]);

  const slotTop = (index) => slotTops[index] ?? gap;
  const getCardHeight = (index) => cardHeights[index] ?? defaultCardHeight;
  const clampIndex = (index, length = items.length) =>
    Math.min(Math.max(index, 0), Math.max(length - 1, 0));

  const targetIndexFromPosition = (
    top,
    activeIndex = dragInfoRef.current.activeIndex,
    tops = slotTopsRef.current,
    heights = cardHeightsRef.current,
    length = itemsRef.current.length
  ) => {
    if (!length) return 0;

    const safeHeight = (index) => heights?.[index] ?? defaultCardHeight;
    const safeTop = (index) => tops?.[index] ?? gap + index * (safeHeight(index) + gap);

    const dragCenter = top + safeHeight(activeIndex) / 2;

    let closestIndex = 0;
    let smallestDelta = Math.abs(dragCenter - (safeTop(0) + safeHeight(0) / 2));

    for (let i = 1; i < length; i += 1) {
      const center = safeTop(i) + safeHeight(i) / 2;
      const delta = Math.abs(dragCenter - center);
      if (delta < smallestDelta) {
        smallestDelta = delta;
        closestIndex = i;
      }
    }

    return clampIndex(closestIndex, length);
  };

  const handleMouseDown = (index) => (event) => {
    const startingTop = slotTop(index);
    const nextInfo = {
      activeIndex: index,
      startY: event.clientY,
      startTop: startingTop,
      dragTop: startingTop,
    };
    dragInfoRef.current = nextInfo;
    setDragInfo(nextInfo);
    onDragStart?.(index);
    event.preventDefault();
  };

  const handleMouseMove = (event) => {
    setDragInfo((info) => {
      if (info.activeIndex === -1) return info;
      const deltaY = event.clientY - info.startY;
      const nextInfo = { ...info, dragTop: info.startTop + deltaY };
      dragInfoRef.current = nextInfo;
      return nextInfo;
    });
  };

  const handleMouseUp = () => {
    const info = dragInfoRef.current;
    if (info.activeIndex === -1) return;

    const startIndex = info.activeIndex;
    const newTop = info.dragTop ?? info.startTop;
    const targetIndex = targetIndexFromPosition(
      newTop,
      startIndex,
      slotTopsRef.current,
      cardHeightsRef.current,
      itemsRef.current.length
    );

    if (targetIndex !== startIndex) {
      const nextItems = moveItem(itemsRef.current, startIndex, targetIndex);
      const nextHeights = moveItem(cardHeightsRef.current, startIndex, targetIndex, defaultCardHeight);

      setItems(nextItems);
      setCardHeights(nextHeights);
      onDragEnd?.(startIndex, targetIndex, nextItems);
    }

    dragInfoRef.current = initialDragInfo;
    setDragInfo({ ...initialDragInfo });
  };

  const Card = (item) => (
    <>
      <h6 className="pg-card-title">{item.title}</h6>
      <p className="pg-board-description">{item.description}</p>
    </>
  );

  const computedHeight =
    (slotTops.length ? slotTop(items.length - 1) + getCardHeight(items.length - 1) + gap : 0);

  return (
    <div
      ref={containerRef}
      className={`pg-board-container ${containerClassName}`}
      style={{ height: computedHeight }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {items.map((item, index) => {
        const isActive = dragInfo.activeIndex === index;
        const currentTop = isActive && dragInfo.dragTop !== null ? dragInfo.dragTop : slotTop(index);

        return (
          <div
            key={item.id}
            className={`pg-card${isActive ? " pg-card-active" : ""} ${cardItemClassName}`}
            style={{ top: `${currentTop}px` }}
            data-index={index}
          >
            <div className="pg-card-wrapper">
              {renderItem ? renderItem(index, item) : <Card {...item} />}
            </div>
            <div className={`pg-grab-btn${isActive ? " pg-grab-btn-active" : ""}`} onMouseDown={handleMouseDown(index)}>
              {renderHandleIcon ? renderHandleIcon() : <BurgerMenuIcon /> }
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PerdanaDraggableList;
