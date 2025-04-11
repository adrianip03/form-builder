import { TextField, IconButton, Dropdown } from "@fluentui/react";
import { MCQQuestionType } from "./type";
import { useState } from "react";

interface Props {
  question: MCQQuestionType;
  isPreviewMode?: boolean;
  onQuestionChange: (
    id: string,
    data: { question?: string; choices?: string[] }
  ) => void;
}

const MCQQuestion = ({
  question,
  isPreviewMode = false,
  onQuestionChange,
}: Props) => {
  const [choices, setChoices] = useState<string[]>(question.choices || []);

  const handleQuestionChange = (value: string) => {
    onQuestionChange(question.id, { question: value });
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
    onQuestionChange(question.id, { choices: newChoices });
  };

  const addChoice = () => {
    const newChoices = [...choices, ""];
    setChoices(newChoices);
    onQuestionChange(question.id, { choices: newChoices });
  };

  const removeChoice = (index: number) => {
    const newChoices = choices.filter((_, i) => i !== index);
    setChoices(newChoices);
    onQuestionChange(question.id, { choices: newChoices });
  };

  return (
    <div className="w-full space-y-2">
      {isPreviewMode ? (
        <div className="preview-mcq-question">
          <p className="question-text">
            {question.question || "Untitled Question"}
          </p>
          <Dropdown
            options={choices.map((choice, index) => ({
              key: index.toString(),
              text: choice || `Option ${index + 1}`,
            }))}
            placeholder="Select an option"
          />
        </div>
      ) : (
        <>
          <TextField
            value={question.question}
            onChange={(_, newValue) => {
              if (newValue !== undefined) {
                handleQuestionChange(newValue);
              }
            }}
            placeholder="Enter your question here"
            underlined
          />
          <div className="space-y-2">
            {choices.map((choice, index) => (
              <div key={index} className="flex items-center gap-2">
                <input type="radio" disabled />
                <TextField
                  value={choice}
                  onChange={(_, newValue) => {
                    if (newValue !== undefined) {
                      handleChoiceChange(index, newValue);
                    }
                  }}
                  placeholder={`Choice ${index + 1}`}
                  underlined
                />
                <IconButton
                  iconProps={{ iconName: "Delete" }}
                  onClick={() => removeChoice(index)}
                  title="Remove choice"
                />
              </div>
            ))}
          </div>
          <IconButton
            iconProps={{ iconName: "Add" }}
            onClick={addChoice}
            title="Add choice"
          />
        </>
      )}
    </div>
  );
};

export default MCQQuestion;
