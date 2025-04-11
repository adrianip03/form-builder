import { useState } from "react";
import "./App.css";
import { nanoid } from "nanoid";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  ContainerType,
  ItemType,
  TableQuestionType,
  MCQQuestionType,
  TextQuestionType,
} from "./components/type";
import Item, { InvisibleDropTarget } from "./components/Item";
import {
  ITextFieldStyles,
  TextField,
  PrimaryButton,
  DefaultButton,
} from "@fluentui/react";
import Section from "./components/Section";

function generateId(prefix = "") {
  return `${prefix}-${nanoid()}`;
}

const newItems: ItemType[] = [
  { id: generateId("New-Item"), type: "section" },
  { id: generateId("New-Item"), type: "text" },
  { id: generateId("New-Item"), type: "mcq" },
  { id: generateId("New-Item"), type: "table" },
];

function App() {
  const [items, setItems] = useState<ContainerType[]>([
    // { id: generateId(), header: "Untitled Section", content: [] },
  ]);
  const [activeType, setActiveType] = useState<
    "section" | "question" | "newItem"
  >("section");
  const [activeSectionId, setActiveSectionId] = useState<number>();
  const [activeQuestionId, setActiveQuestionId] = useState<number>();
  const [overSectionId, setOverSectionId] = useState<number>();
  const [overQuestionId, setOverQuestionId] = useState<number>();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [formHeader, setFormHeader] = useState<string>("");

  function findContainerOfItem(activeId: string) {
    let itemIndex;
    for (const [sectionIndex, section] of items.entries()) {
      itemIndex = section.content.findIndex((item) => item.id === activeId);
      if (itemIndex !== -1) {
        return { sectionId: sectionIndex, questionId: itemIndex };
      }
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;

    const activeIndex = items.findIndex((item) => item.id === active.id);
    if (activeIndex !== -1) {
      setActiveType("section");
      setActiveSectionId(activeIndex);
    } else {
      const result = findContainerOfItem(active.id as string);
      if (result) {
        setActiveType("question");
        const { sectionId: section, questionId: question } = result;
        setActiveSectionId(section);
        setActiveQuestionId(question);
      } else {
        const isNewItem = newItems.some((item) => item.id === active.id);
        if (isNewItem) {
          setActiveType("newItem");
        }
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) return;

    const overResult = findContainerOfItem(over.id as string);
    if (overResult) {
      const { sectionId: sectionId, questionId: questionId } = overResult;
      setOverSectionId(sectionId);
      setOverQuestionId(questionId);
    } else if (over.id.toString().endsWith("-end")) {
      const sectionId = items.findIndex(
        (section) => over.id === `${section.id}-end`
      );
      if (sectionId !== -1) {
        setOverSectionId(sectionId);
        setOverQuestionId(items[sectionId].content.length);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    if (activeType === "newItem") {
      const draggedItem = newItems.find((item) => item.id === active.id);

      if (draggedItem) {
        if (draggedItem.type === "section") {
          // For section type, only create new section if dropped outside existing sections
          if (
            !over.id.toString().includes("-end") ||
            !over.id.toString().includes("-start")
          ) {
            const newSection = {
              id: generateId(),
              header: "",
              content: [],
            };
            const overIndex = items.findIndex((item) => item.id === over.id);

            if (overIndex !== -1) {
              setItems((prev) => {
                const newItems = [...prev];
                newItems.splice(overIndex, 0, newSection);
                return newItems;
              });
            } else {
              const result = findContainerOfItem(over.id as string);
              if (result) {
                const { sectionId } = result;
                setItems((prev) => {
                  const newItems = [...prev];
                  newItems.splice(sectionId, 0, newSection);
                  return newItems;
                });
              } else {
                setItems((prev) => [...prev, newSection]);
              }
            }
          }
        } else if (overSectionId !== undefined) {
          // For other types, add to existing section
          const newItem = {
            id: generateId(),
            type: draggedItem.type,
          };
          setItems((prev) => {
            const updatedItems = prev.map((section) => ({
              ...section,
              content: [...section.content],
            }));
            if (
              overQuestionId !== undefined &&
              overQuestionId !== items[overSectionId].content.length
            ) {
              updatedItems[overSectionId].content.splice(
                overQuestionId,
                0,
                newItem
              );
            } else {
              updatedItems[overSectionId].content.push(newItem);
            }
            return updatedItems;
          });
        }
      }
    } else if (over.id.toString().startsWith("New-Item")) {
      // If dropped in newItems container, delete the item
      if (activeType === "section") {
        setItems((prev) => prev.filter((item) => item.id !== active.id));
      } else if (
        activeType === "question" &&
        activeSectionId !== undefined &&
        activeQuestionId !== undefined
      ) {
        setItems((prev) => {
          const updatedItems = prev.map((section) => ({
            ...section,
            content: [...section.content],
          }));
          updatedItems[activeSectionId].content.splice(activeQuestionId, 1);
          return updatedItems;
        });
      }
    } else if (activeType === "section" && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    } else {
      // for cross section item
      if (activeType === "question" && overSectionId !== activeSectionId) {
        if (
          overSectionId === undefined ||
          activeSectionId === undefined ||
          activeQuestionId === undefined ||
          overQuestionId === undefined
        )
          return;
        setItems((prev) => {
          const updatedItems = prev.map((section) => ({
            ...section,
            content: [...section.content],
          }));
          const question =
            updatedItems[activeSectionId].content[activeQuestionId];
          updatedItems[overSectionId].content.splice(
            overQuestionId,
            0,
            question
          );
          updatedItems[activeSectionId].content.splice(activeQuestionId, 1);

          return updatedItems;
        });
      }
    }
    setActiveQuestionId(undefined);
    setActiveSectionId(undefined);
    setOverSectionId(undefined);
    setOverQuestionId(undefined);
  }

  const formHeaderStyles: Partial<ITextFieldStyles> = {
    field: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#666",
    },
  };

  const handleHeaderChange = (value: string, id: string) => {
    console.log("handleHeaderChange called with:", value, id);
    setItems((prev) => {
      const updatedItems = prev.map((section) =>
        section.id === id ? { ...section, header: value } : section
      );
      console.log("Updated items:", updatedItems);
      return updatedItems;
    });
  };

  const getActive = () => {
    if (activeType === "section" && activeSectionId) {
      const section = items[activeSectionId];
      return (
        <Section
          container={section}
          items={section.content}
          key={section.id}
          handleHeaderChange={handleHeaderChange}
          isOver={
            overSectionId !== undefined &&
            activeSectionId !== overSectionId &&
            activeType === "section" &&
            section.id === items[overSectionId].id
          }
        >
          <InvisibleDropTarget
            id={`${section.id}-start`}
            isOver={
              activeSectionId !== undefined &&
              overSectionId !== undefined &&
              activeType !== "section" &&
              activeSectionId !== overSectionId &&
              section.id === items[overSectionId].id &&
              overQuestionId === 0
            }
          />
          {section.content.map((question) => (
            <Item
              key={question.id}
              item={question}
              isOver={
                overSectionId !== undefined &&
                overQuestionId !== undefined &&
                activeType !== "section" &&
                activeSectionId !== overSectionId &&
                section.id === items[overSectionId].id &&
                question.id === items[overSectionId].content[overQuestionId]?.id
              }
            />
          ))}
        </Section>
      );
    } else {
      if (!activeQuestionId || !activeSectionId) return null;
      const question = items[activeSectionId].content[activeQuestionId];
      return <Item key={question.id} item={question} isOver={false} />;
    }
  };

  const handleQuestionChange = (
    id: string,
    data: {
      question?: string;
      choices?: string[];
      columns?: string[];
      rows?: string[][];
    }
  ) => {
    const result = findContainerOfItem(id);
    if (result) {
      const { sectionId, questionId } = result;
      setItems((prev) => {
        const updatedItems = prev.map((section) => ({
          ...section,
          content: [...section.content],
        }));
        updatedItems[sectionId].content[questionId] = {
          ...updatedItems[sectionId].content[questionId],
          ...data,
        };
        console.log("Updated items:", updatedItems);
        return updatedItems;
      });
    }
  };

  const handleSubmit = () => {
    console.log("Form submitted:", { formHeader, items });
    fetch("/api/forms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        header: formHeader,
        items: items.map((section) => ({
          ...section,
          content: section.content.map((item) => {
            if (item.type === "text") {
              return { ...item, question: (item as TextQuestionType).question };
            } else if (item.type === "mcq") {
              return {
                ...item,
                question: (item as MCQQuestionType).question,
                choices: (item as MCQQuestionType).choices,
              };
            } else if (item.type === "table") {
              return {
                ...item,
                question: (item as TableQuestionType).question,
                columns: (item as TableQuestionType).columns,
              };
            }
            return item;
          }),
        })),
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
        // Optionally show success message or redirect
      })
      .catch((error) => {
        console.error("Error submitting form:", error);
        // Optionally show error message to user
      });
    // TODO: Submit form to server
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
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
              onClick={() => {
                setIsPreviewMode(!isPreviewMode);
                console.log(items);
              }}
            />
            {isPreviewMode && (
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
              {items &&
                items.map((section) => {
                  return (
                    <Section
                      key={section.id}
                      container={section}
                      items={section.content}
                      handleHeaderChange={handleHeaderChange}
                      isPreviewMode={isPreviewMode}
                      isOver={
                        overSectionId !== undefined &&
                        activeSectionId !== overSectionId &&
                        activeType === "section" &&
                        section.id === items[overSectionId].id
                      }
                    >
                      {section.content.map((question) => (
                        <Item
                          key={question.id}
                          item={question}
                          isOver={
                            overSectionId !== undefined &&
                            overQuestionId !== undefined &&
                            activeType !== "section" &&
                            section.id === items[overSectionId].id &&
                            question.id ===
                              items[overSectionId].content[overQuestionId]?.id
                          }
                          onQuestionChange={handleQuestionChange}
                          isPreviewMode={isPreviewMode}
                        />
                      ))}
                      <InvisibleDropTarget
                        id={`${section.id}-end`}
                        isOver={
                          overSectionId !== undefined &&
                          activeSectionId !== overSectionId &&
                          activeType !== "section" &&
                          section.id === items[overSectionId].id &&
                          overQuestionId === section.content.length
                        }
                      />
                    </Section>
                  );
                })}
            </div>
          </div>
          {!isPreviewMode && (
            <div className="add-element-panel gap-8 p-1">
              <Section
                key={generateId()}
                container={{ id: "New-Item", header: "New Items", content: [] }}
                items={[]}
                isNew={true}
                handleHeaderChange={handleHeaderChange}
              >
                {newItems.map((newItem) => (
                  <Item
                    key={newItem.id}
                    item={newItem}
                    isOver={false}
                    isNew={true}
                  />
                ))}
                <InvisibleDropTarget id={`New-Item-end`} isOver={false} />
              </Section>
            </div>
          )}
        </div>
      </div>
      <DragOverlay>{getActive()}</DragOverlay>
    </DndContext>
  );
}

export default App;
