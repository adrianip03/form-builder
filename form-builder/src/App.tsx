import { useState } from "react";
import "./App.css";
import { nanoid } from "nanoid";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  ItemType,
  MCQQuestionType,
  TableQuestionType,
  TextQuestionType,
} from "./components/type";
import Item, { InvisibleDropTarget } from "./components/Item";
import {
  ITextFieldStyles,
  TextField,
  PrimaryButton,
  DefaultButton,
} from "@fluentui/react";

function generateId(prefix = "") {
  return `${prefix}-${nanoid()}`;
}

const newItems: ItemType[] = [
  { id: generateId("New-Item"), type: "text" },
  { id: generateId("New-Item"), type: "mcq" },
  { id: generateId("New-Item"), type: "table" },
];

function App() {
  const [items, setItems] = useState<ItemType[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [overId, setOverId] = useState<string>();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [formHeader, setFormHeader] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    setOverId(over.id as string);
    if (!active.id.toString().startsWith("New-Item") && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    if (active.id.toString().startsWith("New-Item")) {
      const draggedItem = newItems.find((item) => item.id === active.id);
      if (draggedItem) {
        const newItem = {
          ...draggedItem,
          id: generateId(),
        };
        const overIndex = items.findIndex((item) => item.id === over.id);
        if (overIndex !== -1) {
          setItems((prev) => {
            const newItems = [...prev];
            newItems.splice(overIndex, 0, newItem);
            return newItems;
          });
        } else {
          setItems((prev) => [...prev, newItem]);
        }
      }
    } else if (over.id.toString().startsWith("New-Item")) {
      setItems((prev) => prev.filter((item) => item.id !== active.id));
    } else if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(undefined);
    setOverId(undefined);
  }

  // const dropAnimationConfig: DropAnimation = {
  //   sideEffects: defaultDropAnimationSideEffects({
  //     styles: {
  //       active: {
  //         opacity: "0.4",
  //       },
  //     },
  //   }),
  // };

  const formHeaderStyles: Partial<ITextFieldStyles> = {
    field: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#666",
    },
  };

  const handleQuestionChange = (id: string, data: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const handleSubmit = () => {
    console.log("Form submitted:", { formHeader, items });
    fetch("/api/forms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        formName: formHeader,
        questions: items.map((item) => {
          const baseQuestion = {
            questionType: item.type,
            questionText:
              (item as TextQuestionType | MCQQuestionType | TableQuestionType)
                .question || "",
          };

          if (item.type === "mcq") {
            return {
              ...baseQuestion,
              choices: (item as MCQQuestionType).choices || [],
            };
          } else if (item.type === "table") {
            return {
              ...baseQuestion,
              columns: (item as TableQuestionType).columns || [],
            };
          }
          return baseQuestion;
        }),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Form submitted successfully:", data);
      })
      .catch((error) => {
        console.error("Error submitting form:", error);
      });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < items.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handlePreviewModeToggle = () => {
    setIsPreviewMode(!isPreviewMode);
    setCurrentQuestionIndex(0);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div>
        <div className="flex justify-between items-center p-4 border-b">
          <TextField
            value={formHeader}
            onChange={(_, newValue) => {
              if (newValue !== undefined) {
                setFormHeader(newValue);
              }
            }}
            styles={formHeaderStyles}
            underlined
            placeholder="Untitled Form"
            disabled={isPreviewMode}
          />
          <div className="flex gap-2">
            <DefaultButton
              text={isPreviewMode ? "Edit" : "Preview"}
              onClick={handlePreviewModeToggle}
            />
            {isPreviewMode && currentQuestionIndex === items.length - 1 && (
              <PrimaryButton text="Submit" onClick={handleSubmit} />
            )}
          </div>
        </div>
        <div className="flex">
          <div
            className={`form-panel gap-8 p-1 ${
              isPreviewMode ? "preview-mode" : ""
            }`}
          >
            <div className="outline p-2">
              {isPreviewMode ? (
                <>
                  {items.length > 0 && (
                    <Item
                      key={items[currentQuestionIndex].id}
                      item={items[currentQuestionIndex]}
                      isOver={false}
                      onQuestionChange={handleQuestionChange}
                      isPreviewMode={true}
                    />
                  )}
                  <div className="flex justify-between mt-4">
                    <DefaultButton
                      text="Previous"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                    />
                    <DefaultButton
                      text="Next"
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === items.length - 1}
                    />
                  </div>
                </>
              ) : (
                <>
                  {items.map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      isOver={overId === item.id}
                      onQuestionChange={handleQuestionChange}
                      isPreviewMode={false}
                    />
                  ))}
                  <InvisibleDropTarget
                    id="form-end"
                    isOver={overId === "form-end"}
                  />
                </>
              )}
            </div>
          </div>
          {!isPreviewMode && (
            <div className="add-element-panel gap-8 p-1">
              <div className="outline p-2">
                <h2 className="text-xl font-semibold mb-4">Add Question</h2>
                {newItems.map((newItem) => (
                  <Item
                    key={newItem.id}
                    item={newItem}
                    isOver={false}
                    isNew={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <DragOverlay>
        {activeId ? (
          <Item
            item={
              items.find((item) => item.id === activeId) ||
              newItems.find((item) => item.id === activeId)!
            }
            isOver={false}
            isPreviewMode={isPreviewMode}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
