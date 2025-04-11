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
} from "./components/type";
import Item from "./components/Item";
import {
  ITextFieldStyles,
  TextField,
  PrimaryButton,
  DefaultButton,
} from "@fluentui/react";
import { FormProvider } from "./context/FormContext";
import QuestionControl from "./components/QuestionControl";

function generateId(prefix = "") {
  return `${prefix}-${nanoid()}`;
}

const newItems: ItemType[] = [
  { id: generateId("New-Item"), type: "text", question: "" },
  { id: generateId("New-Item"), type: "mcq", question: "" },
  { id: generateId("New-Item"), type: "table", question: "" },
];

interface Answer {
  text?: string;
  choice?: string;
  tableAnswers?: Record<string, string>;
}

function App() {
  // States
  const [items, setItems] = useState<ItemType[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [overId, setOverId] = useState<string>();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [formHeader, setFormHeader] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  // DnD Sensors
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

  // DnD Handlers
  // Set active item (dragging)
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
  }

  // Set over item (hovering)
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    setOverId(over.id as string);
    if (active.id.toString().startsWith("New-Item")) {
      // TODO: Add new item overlay
      // idea: add a new item overlay to the over item
      // then update newitem list to re-add the item in drag end
    } else if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  // Handle drag end (dropping)
  // If dropping on a new item, add it to the items array
  // If dropping on an existing item, move it to the new position
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

  // Form Header Styles
  const formHeaderStyles: Partial<ITextFieldStyles> = {
    field: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#666",
    },
  };

  // Change ...data of question at items[id]
  const handleQuestionChange = (id: string, data: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  // Handle answer changes in preview mode
  const handleAnswerChange = (questionId: string, answer: Answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Submit form to backend
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
            questionText: item.question || "",
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

  // Toggle preview mode
  // Reset current question index and history
  const handlePreviewModeToggle = () => {
    setIsPreviewMode(!isPreviewMode);
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  return (
    <div className="App">
      <FormProvider items={items}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div>
            {/* Top Bar*/}
            <div className="flex justify-between items-center p-4 border-b">
              {/* Form Header */}
              <TextField
                value={formHeader}
                onChange={(_, newValue) => setFormHeader(newValue || "")}
                placeholder="Form Title"
                underlined
                styles={formHeaderStyles}
              />
              {/* Preview/Edit Button */}
              <div className="flex gap-2">
                <DefaultButton
                  text={isPreviewMode ? "Edit" : "Preview"}
                  onClick={handlePreviewModeToggle}
                />
                {isPreviewMode && (
                  <PrimaryButton text="Submit" onClick={handleSubmit} />
                )}
              </div>
            </div>
            {/* Form Body */}
            <div className="flex">
              {/* Form Panel */}
              <div
                className={`form-panel gap-8 p-1 ${
                  isPreviewMode ? "preview-mode" : ""
                }`}
              >
                {/* Question */}
                <div className="outline p-2">
                  {isPreviewMode ? (
                    <>
                      {/* Question in preview mode with previous and next button*/}
                      {items.length > 0 && (
                        <Item
                          key={items[currentQuestionIndex].id}
                          item={items[currentQuestionIndex]}
                          isOver={false}
                          isPreviewMode={true}
                          isNew={false}
                          onQuestionChange={handleQuestionChange}
                          onAnswerChange={handleAnswerChange}
                          answer={answers[items[currentQuestionIndex].id]}
                        />
                      )}
                      <QuestionControl
                        currentQuestionIndex={currentQuestionIndex}
                        isPreview={isPreviewMode}
                        setCurrentQuestionIndex={setCurrentQuestionIndex}
                      />
                    </>
                  ) : (
                    <>
                      {/* Question in edit mode */}
                      {items.map((item) => (
                        <Item
                          key={item.id}
                          item={item}
                          isOver={overId === item.id}
                          isPreviewMode={false}
                          isNew={false}
                          onQuestionChange={handleQuestionChange}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
              {/* Add Question Panel */}
              {/* Only show when not in preview mode */}
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
                        isPreviewMode={false}
                        onQuestionChange={handleQuestionChange}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Drag Overlay */}
          <DragOverlay>
            {activeId ? (
              <Item
                item={
                  items.find((item) => item.id === activeId) ||
                  newItems.find((item) => item.id === activeId)!
                }
                isOver={false}
                isPreviewMode={isPreviewMode}
                isNew={false}
                onQuestionChange={handleQuestionChange}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </FormProvider>
    </div>
  );
}

export default App;
