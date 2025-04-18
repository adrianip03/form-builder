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
} from "./components/types";
import Item from "./components/Item";
import { FormProvider } from "./context/FormContext";
import QuestionControl from "./components/QuestionControl";
import toast, { Toaster } from "react-hot-toast";
import TopBar from "./components/TopBar";

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
  const [formId, setFormId] = useState<string>("");

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

  // Change ...data of question at items[id]
  const handleQuestionChange = (id: string, data: Partial<ItemType>) => {
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
  const formSubmit = async () => {
    console.log("Form submitted:", { formHeader, items });
    try {
      const response = await fetch("http://localhost:3001/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formName: formHeader,
          questions: items.map((item) => {
            const baseQuestion = {
              id: item.id,
              questionType: item.type,
              questionText: item.question || "",
            };

            if (item.type === "text") {
              return {
                ...baseQuestion,
                minLength: (item as TextQuestionType).minLength,
                maxLength: (item as TextQuestionType).maxLength,
              };
            } else if (item.type === "mcq") {
              return {
                ...baseQuestion,
                choices:
                  (item as MCQQuestionType).choices?.map((choice) => ({
                    text: choice.text,
                    nextQuestionId: choice.nextQuestionId,
                  })) || [],
              };
            } else if (item.type === "table") {
              return {
                ...baseQuestion,
                columns:
                  (item as TableQuestionType).columns?.map((column) => ({
                    header: column.header,
                    type: column.type,
                    choices: column.choices,
                  })) || [],
              };
            }
            return baseQuestion;
          }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create form");
      }

      const data = await response.json();
      console.log("Form created successfully:", data);
      toast.success("Form created successfully!");
      setFormId(data.formId);
      return true;
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error instanceof Error) {
        if (error.message === "Failed to fetch") {
          toast.error(
            "Unable to connect to the server. Please make sure the server is running."
          );
        } else {
          toast.error(
            error.message || "An error occurred while submitting the form"
          );
        }
      }
      return false;
    }
  };

  // Toggle preview mode
  // Reset current question index and history
  const handlePreviewModeToggle = async () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    if (!isPreviewMode) {
      const err = checkFormError();
      if (Object.keys(err).length > 0) {
        toast.error(
          Object.entries(err)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n")
        );
      } else {
        const success = await formSubmit();
        if (success) {
          setIsPreviewMode(!isPreviewMode);
        }
      }
    } else {
      setIsPreviewMode(!isPreviewMode);
    }
  };

  const formHeaderError = () => {
    if (formHeader.length === 0) {
      return "Form title is required";
    }
    return null;
  };

  const questionsError = () => {
    if (items.length === 0) {
      return "Please add at least one question";
    }
    return null;
  };

  const questionTextError = (question: ItemType) => {
    if (question.question.length === 0) {
      return "Question is required";
    }
    return null;
  };

  const textConstraintsError = (minLength?: number, maxLength?: number) => {
    const errors = [];
    if (minLength !== undefined && minLength < 0) {
      errors.push("Minimum length must be greater than or equal to 0");
    }
    if (maxLength !== undefined && maxLength < 0) {
      errors.push("Maximum length must be greater than or equal to 0");
    }
    if (
      minLength !== undefined &&
      maxLength !== undefined &&
      maxLength <= minLength
    ) {
      errors.push("Maximum length must be greater than minimum length");
    }
    return errors;
  };

  const questionChoiceError = (question: MCQQuestionType) => {
    const errors = [];
    if (
      !question.choices ||
      (question.choices && question.choices.length === 0)
    ) {
      errors.push("Please add at least one choice");
    }
    if (question.choices && question.choices.length > 0) {
      for (const choice of question.choices) {
        if (choice.text.length === 0) {
          errors.push("Choice text is required");
        }
      }
    }
    return errors;
  };

  const questionTableError = (question: TableQuestionType) => {
    const errors = [];
    if (
      (question.columns && question.columns.length === 0) ||
      !question.columns
    ) {
      errors.push("Please add at least one column");
    }
    if (question.columns && question.columns.length > 0) {
      for (const column of question.columns) {
        if (column.header.length === 0) {
          errors.push("Column header is required");
        }
        if (column.type === "mcq" && column.choices?.length === 0) {
          errors.push("Please add at least one choice");
        }
      }
    }
    return errors;
  };

  const checkFormError = () => {
    let validationErrors = {};
    if (formHeaderError()) {
      validationErrors = {
        ...validationErrors,
        formHeader: formHeaderError() || "",
      };
    }
    if (questionsError()) {
      validationErrors = {
        ...validationErrors,
        questions: questionsError() || "",
      };
    }
    items.forEach((question, index) => {
      if (questionTextError(question)) {
        validationErrors = {
          ...validationErrors,
          [`question-${index + 1}`]: questionTextError(question) || "",
        };
      }
      if (question.type === "text") {
        const textQuestion = question as TextQuestionType;
        const constraintError = textConstraintsError(
          textQuestion.minLength,
          textQuestion.maxLength
        );
        if (constraintError.length > 0) {
          constraintError.forEach((error) => {
            validationErrors = {
              ...validationErrors,
              [`question-${index + 1}-constraints`]: error,
            };
          });
        }
      }
      if (question.type === "mcq") {
        const mcqQuestion = question as MCQQuestionType;
        const choiceErrors = questionChoiceError(mcqQuestion);
        if (choiceErrors.length > 0) {
          choiceErrors.forEach((error, choiceIndex) => {
            validationErrors = {
              ...validationErrors,
              [`question-${index + 1}-choice-${choiceIndex + 1}`]: error || "",
            };
          });
        }
      }
      if (question.type === "table") {
        const tableQuestion = question as TableQuestionType;
        if (questionTableError(tableQuestion)) {
          questionTableError(tableQuestion).forEach((error, columnIndex) => {
            validationErrors = {
              ...validationErrors,
              [`question-${index + 1}-column-${columnIndex + 1}`]: error || "",
            };
          });
        }
      }
    });
    return validationErrors;
  };

  const handleSubmitAnswers = async () => {
    try {
      // Convert answers to the format expected by the backend
      const formattedAnswers = Object.entries(answers)
        .map(([questionId, answer]) => {
          const question = items.find((item) => item.id === questionId);
          if (!question) return null;

          const baseAnswer = {
            questionId: question.id,
          };

          if (question.type === "text") {
            return {
              ...baseAnswer,
              text: answer.text,
            };
          } else if (question.type === "mcq") {
            const selectedChoice = (question as MCQQuestionType).choices[
              parseInt(answer.choice || "0")
            ];
            return {
              ...baseAnswer,
              choiceText: selectedChoice?.text || null,
            };
          } else if (question.type === "table") {
            return {
              ...baseAnswer,
              tableData: answer.tableAnswers,
            };
          }
          return null;
        })
        .filter(Boolean);

      console.log("Submitting answers:", {
        formId,
        answers: formattedAnswers,
      });

      const response = await fetch(
        `http://localhost:3001/api/forms/${formId}/answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: formattedAnswers,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        console.error("Server response:", data);
        throw new Error(data.error || "Failed to submit answers");
      }

      toast.success("Answers submitted successfully!");
      // Reset the form or navigate away
      setAnswers({});
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error("Error submitting answers:", error);
      if (error instanceof Error) {
        toast.error(
          error.message || "An error occurred while submitting answers"
        );
      }
    }
  };

  return (
    <div className="App">
      <Toaster />
      <FormProvider items={items}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div>
            <TopBar
              currentQuestionIndex={currentQuestionIndex}
              formHeader={formHeader}
              setFormHeader={setFormHeader}
              isPreviewMode={isPreviewMode}
              handlePreviewModeToggle={handlePreviewModeToggle}
              formHeaderError={formHeaderError}
              answers={answers}
              onSubmit={handleSubmitAnswers}
            />
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
                        answers={answers}
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
