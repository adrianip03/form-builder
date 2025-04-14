import { TextField, PrimaryButton, DefaultButton } from "@fluentui/react";
import { ITextFieldStyles } from "@fluentui/react";
import { useFormContext } from "../context/FormContext";
import { useEffect } from "react";

interface Props {
  formHeader: string;
  setFormHeader: (value: string) => void;
  isPreviewMode: boolean;
  handlePreviewModeToggle: () => void;
  formHeaderError: () => string | null;
  currentQuestionIndex: number;
}

const formHeaderStyles: Partial<ITextFieldStyles> = {
  field: {
    fontSize: "2rem",
    fontWeight: 600,
    color: "#666",
  },
};

export default function TopBar({
  formHeader,
  setFormHeader,
  isPreviewMode,
  handlePreviewModeToggle,
  formHeaderError,
  currentQuestionIndex,
}: Props) {
  const { items, nextQuestionId } = useFormContext();

  const isLastQuestion = () => {
    return currentQuestionIndex === items.length - 1 && !nextQuestionId;
  };

  useEffect(() => {
    console.log(nextQuestionId);
    console.log(isLastQuestion());
  }, [nextQuestionId]);

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <TextField
        value={formHeader}
        onChange={(_, newValue) => setFormHeader(newValue || "")}
        placeholder="Enter form title"
        underlined
        styles={formHeaderStyles}
        disabled={isPreviewMode}
        errorMessage={formHeaderError()}
      />
      <div className="flex gap-2">
        <DefaultButton
          text={isPreviewMode ? "Edit" : "Preview"}
          onClick={handlePreviewModeToggle}
        />
        {isPreviewMode && (
          <PrimaryButton text="Submit" disabled={!isLastQuestion()} />
        )}
      </div>
    </div>
  );
}
