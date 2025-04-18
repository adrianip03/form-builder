import { TextField, IconButton, Dropdown } from "@fluentui/react";
import { TableQuestionType, TableColumnType } from "./types";
import { useState } from "react";

interface Props {
  question: TableQuestionType;
  isPreviewMode?: boolean;
  onQuestionChange: (
    id: string,
    data: { question?: string; columns?: TableColumnType[] }
  ) => void;
  onAnswerChange?: (
    questionId: string,
    answer: { tableAnswers: Record<string, string> }
  ) => void;
  answer?: { tableAnswers?: Record<string, string> };
}

const TableQuestion = ({
  question,
  isPreviewMode = false,
  onQuestionChange,
  onAnswerChange,
  answer,
}: Props) => {
  const [columns, setColumns] = useState<TableColumnType[]>(
    Array.isArray(question.columns) ? question.columns : []
  );

  const handleQuestionChange = (value: string) => {
    onQuestionChange(question.id, { question: value });
  };

  const handleColumnTypeChange = (index: number, type: "text" | "mcq") => {
    const newColumns = [...columns];
    newColumns[index] = {
      ...newColumns[index],
      type,
      choices: type === "mcq" ? [""] : undefined,
    };
    setColumns(newColumns);
    onQuestionChange(question.id, { columns: newColumns });
  };

  const handleColumnHeaderChange = (index: number, value: string) => {
    const newColumns = [...columns];
    newColumns[index] = {
      ...newColumns[index],
      header: value,
    };
    setColumns(newColumns);
    onQuestionChange(question.id, { columns: newColumns });
  };

  const handleColumnChoiceChange = (
    columnIndex: number,
    choiceIndex: number,
    value: string
  ) => {
    const newColumns = [...columns];
    if (!newColumns[columnIndex].choices) {
      newColumns[columnIndex].choices = [""];
    }
    newColumns[columnIndex].choices![choiceIndex] = value;
    setColumns(newColumns);
    onQuestionChange(question.id, { columns: newColumns });
  };

  const addColumnChoice = (columnIndex: number) => {
    const newColumns = [...columns];
    if (!newColumns[columnIndex].choices) {
      newColumns[columnIndex].choices = [""];
    }
    newColumns[columnIndex].choices!.push("");
    setColumns(newColumns);
    onQuestionChange(question.id, { columns: newColumns });
  };

  const removeColumnChoice = (columnIndex: number, choiceIndex: number) => {
    const newColumns = [...columns];
    if (newColumns[columnIndex].choices) {
      newColumns[columnIndex].choices = newColumns[columnIndex].choices!.filter(
        (_, i) => i !== choiceIndex
      );
    }
    setColumns(newColumns);
    onQuestionChange(question.id, { columns: newColumns });
  };

  const addColumn = () => {
    const newColumn: TableColumnType = {
      id: `column-${Date.now()}`,
      type: "text",
      header: "",
    };
    const newColumns = [...columns, newColumn];
    setColumns(newColumns);
    onQuestionChange(question.id, { columns: newColumns });
  };

  const removeColumn = (index: number) => {
    const newColumns = columns.filter((_, i) => i !== index);
    setColumns(newColumns);
    onQuestionChange(question.id, { columns: newColumns });
  };

  const handleTableAnswerChange = (columnIndex: number, value: string) => {
    if (onAnswerChange) {
      const currentAnswers = answer?.tableAnswers || {};
      onAnswerChange(question.id, {
        tableAnswers: {
          ...currentAnswers,
          [columnIndex]: value,
        },
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      {isPreviewMode ? (
        <div className="preview-table-question">
          <p className="question-text">
            {question.question || "Untitled Question"}
          </p>
          <div className="space-y-2">
            <div className="table-header">
              {columns.map((column, index) => (
                <div key={column.id} className="flex-1 space-y-2">
                  <p className="table-column-header">
                    {column.header || `Column ${index + 1}`}
                  </p>
                  {column.type === "text" && (
                    <TextField
                      placeholder="Your answer here"
                      underlined
                      value={answer?.tableAnswers?.[index] || ""}
                      onChange={(_, newValue) => {
                        if (newValue !== undefined) {
                          handleTableAnswerChange(index, newValue);
                        }
                      }}
                    />
                  )}
                  {column.type === "mcq" && (
                    <Dropdown
                      options={column.choices!.map((choice, index) => ({
                        key: index.toString(),
                        text: choice || `Option ${index + 1}`,
                      }))}
                      placeholder="Select an option"
                      selectedKey={answer?.tableAnswers?.[index]}
                      onChange={(_, option) => {
                        if (option) {
                          handleTableAnswerChange(index, option.key as string);
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <TextField
            value={question.question || ""}
            onChange={(_, newValue) => {
              if (newValue !== undefined) {
                handleQuestionChange(newValue);
              }
            }}
            placeholder="Enter your question here"
            underlined
            errorMessage={
              !question.question || question.question.trim().length === 0
                ? "Question is required"
                : columns.length === 0
                ? "At least one column is required"
                : undefined
            }
          />
          <div className="space-y-2">
            <div className="table-header">
              {columns.map((column, columnIndex) => (
                <div key={column.id} className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <TextField
                      value={column.header}
                      onChange={(_, newValue) => {
                        if (newValue !== undefined) {
                          handleColumnHeaderChange(columnIndex, newValue);
                        }
                      }}
                      placeholder={`Column ${columnIndex + 1}`}
                      underlined
                      errorMessage={
                        !column.header || column.header.trim().length === 0
                          ? "Column header is required"
                          : column.type === "mcq" &&
                            (!column.choices || column.choices.length === 0)
                          ? "At least one choice is required"
                          : undefined
                      }
                    />
                    <Dropdown
                      options={[
                        { key: "text", text: "Text" },
                        { key: "mcq", text: "MCQ" },
                      ]}
                      selectedKey={column.type}
                      onChange={(_, option) => {
                        if (option) {
                          handleColumnTypeChange(
                            columnIndex,
                            option.key as "text" | "mcq"
                          );
                        }
                      }}
                    />
                    <IconButton
                      iconProps={{ iconName: "Delete" }}
                      onClick={() => removeColumn(columnIndex)}
                      title="Remove column"
                    />
                  </div>
                  {column.type === "mcq" && column.choices && (
                    <div className="mcq-choice-options">
                      {column.choices.map((choice, choiceIndex) => (
                        <div
                          key={choiceIndex}
                          className="flex items-center gap-2"
                        >
                          <input type="radio" disabled />
                          <TextField
                            value={choice}
                            onChange={(_, newValue) => {
                              if (newValue !== undefined) {
                                handleColumnChoiceChange(
                                  columnIndex,
                                  choiceIndex,
                                  newValue
                                );
                              }
                            }}
                            placeholder={`Choice ${choiceIndex + 1}`}
                            underlined
                            errorMessage={
                              !choice || choice.trim().length === 0
                                ? "Choice text is required"
                                : undefined
                            }
                          />
                          <IconButton
                            iconProps={{ iconName: "Delete" }}
                            onClick={() =>
                              removeColumnChoice(columnIndex, choiceIndex)
                            }
                            title="Remove choice"
                          />
                        </div>
                      ))}
                      <IconButton
                        iconProps={{ iconName: "Add" }}
                        onClick={() => addColumnChoice(columnIndex)}
                        title="Add choice"
                      />
                    </div>
                  )}
                </div>
              ))}
              <IconButton
                iconProps={{ iconName: "Add" }}
                onClick={addColumn}
                title="Add column"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TableQuestion;
