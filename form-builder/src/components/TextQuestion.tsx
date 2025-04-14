import { TextField } from "@fluentui/react";
import { TextQuestionType } from "./types";

interface Props {
  question: TextQuestionType;
  isPreviewMode?: boolean;
  onQuestionChange: (
    id: string,
    data: { question?: string; minLength?: number; maxLength?: number }
  ) => void;
  onAnswerChange?: (questionId: string, answer: { text: string }) => void;
  answer?: { text?: string };
}

const TextQuestion = ({
  question,
  isPreviewMode = false,
  onQuestionChange,
  onAnswerChange,
  answer,
}: Props) => {
  const handleQuestionChange = (value: string) => {
    onQuestionChange(question.id, { question: value });
  };

  const handleMinLengthChange = (value: string) => {
    const numValue = value === "" ? undefined : parseInt(value);
    onQuestionChange(question.id, { minLength: numValue });
  };

  const handleMaxLengthChange = (value: string) => {
    const numValue = value === "" ? undefined : parseInt(value);
    onQuestionChange(question.id, { maxLength: numValue });
  };

  return (
    <div className="w-full">
      {isPreviewMode ? (
        <div className="preview-text-question">
          <p className="question-text">
            {question.question || "Untitled Question"}
          </p>
          <TextField
            placeholder="Your answer here"
            underlined
            value={answer?.text || ""}
            onChange={(_, newValue) => {
              if (newValue !== undefined && onAnswerChange) {
                onAnswerChange(question.id, { text: newValue });
              }
            }}
            errorMessage={
              question.minLength &&
              (answer?.text?.length || 0) < question.minLength
                ? `Minimum length is ${question.minLength} characters`
                : question.maxLength &&
                  (answer?.text?.length || 0) > question.maxLength
                ? `Maximum length is ${question.maxLength} characters`
                : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
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
                : undefined
            }
          />
          <div className="flex gap-4">
            <TextField
              label="Min Length"
              type="number"
              value={question.minLength?.toString() || ""}
              onChange={(_, newValue) => {
                if (newValue !== undefined) {
                  handleMinLengthChange(newValue);
                }
              }}
              placeholder="No minimum"
              styles={{ root: { width: "150px" } }}
            />
            <TextField
              label="Max Length"
              type="number"
              value={question.maxLength?.toString() || ""}
              onChange={(_, newValue) => {
                if (newValue !== undefined) {
                  handleMaxLengthChange(newValue);
                }
              }}
              placeholder="No maximum"
              styles={{ root: { width: "150px" } }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TextQuestion;
