import { TextField, IconButton, Dropdown } from "@fluentui/react";
import { MCQQuestionType, BranchingChoice } from "./types";
import { useEffect, useState } from "react";
import { useFormContext } from "../context/FormContext";

interface Props {
  question: MCQQuestionType;
  isPreviewMode?: boolean;
  onQuestionChange: (
    id: string,
    data: { question?: string; choices?: BranchingChoice[] }
  ) => void;
  onAnswerChange?: (questionId: string, answer: { choice: string }) => void;
  answer?: { choice?: string };
}

const MCQQuestion = ({
  question,
  isPreviewMode = false,
  onQuestionChange,
  onAnswerChange,
  answer,
}: Props) => {
  const { items, nextQuestionId, setNextQuestionId } = useFormContext();
  const [choices, setChoices] = useState<BranchingChoice[]>(
    Array.isArray(question.choices) ? question.choices : []
  );

  useEffect(() => {
    if (answer?.choice) {
      const selectedChoice = choices[parseInt(String(answer.choice))];
      if (selectedChoice.nextQuestionId) {
        setNextQuestionId(selectedChoice.nextQuestionId);
      } else {
        setNextQuestionId("");
      }
    }
  }, [answer?.choice, nextQuestionId]);

  const handleQuestionChange = (value: string) => {
    onQuestionChange(question.id, { question: value });
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index].text = value;
    setChoices(newChoices);
    onQuestionChange(question.id, { choices: newChoices });
  };

  const handleNextQuestionIdChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index].nextQuestionId = value;
    setChoices(newChoices);
    onQuestionChange(question.id, { choices: newChoices });
  };

  const addChoice = () => {
    const newChoices = [...choices, { text: "", nextQuestionId: "" }];
    setChoices(newChoices);
    onQuestionChange(question.id, { choices: newChoices });
  };

  const removeChoice = (index: number) => {
    const newChoices = choices.filter((_, i) => i !== index);
    setChoices(newChoices);
    onQuestionChange(question.id, { choices: newChoices });
  };

  return (
    <div className="w-full">
      {isPreviewMode ? (
        <div className="preview-mcq-question">
          <p className="question-text">
            {question.question || "Untitled Question"}
          </p>
          <Dropdown
            options={choices.map((choice, index) => ({
              key: index.toString(),
              text: choice.text || `Option ${index + 1}`,
            }))}
            placeholder="Select an option"
            selectedKey={answer?.choice}
            onChange={(_, option) => {
              if (option && onAnswerChange) {
                onAnswerChange(question.id, { choice: option.key as string });
              }
            }}
          />
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
          />
          <div className="space-y-2">
            {choices.map((choice, index) => (
              <div key={index} className="flex items-center gap-2">
                <IconButton
                  iconProps={{ iconName: "Delete" }}
                  onClick={() => removeChoice(index)}
                  title="Remove choice"
                />
                <TextField
                  value={choice.text}
                  onChange={(_, newValue) => {
                    if (newValue !== undefined) {
                      handleChoiceChange(index, newValue);
                    }
                  }}
                  placeholder={`Choice ${index + 1}`}
                  underlined
                />
                <Dropdown
                  options={[
                    { key: "", text: "Next" },
                    ...items
                      .filter((item) => item.id !== question.id)
                      .map((item, index) => ({
                        key: item.id,
                        text: `${index + 1}. ${
                          item.question || "Untitled Question"
                        }`,
                      })),
                  ]}
                  selectedKey={choice.nextQuestionId}
                  onChange={(_, option) => {
                    if (option) {
                      handleNextQuestionIdChange(index, option.key as string);
                    }
                  }}
                  styles={{
                    root: { width: "300px" },
                    dropdown: { width: "300px" },
                  }}
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
