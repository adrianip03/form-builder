import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconButton } from "@fluentui/react";
import { initializeIcons } from "@fluentui/react";
import { ItemType, MCQQuestionType, TableQuestionType } from "./type";
import TextQuestion from "./TextQuestion";
import MCQQuestion from "./MCQQuestion";
import TableQuestion from "./TableQuestion";
import { CSSProperties } from "react";

initializeIcons();

interface Props {
  item: ItemType;
  isOver: boolean;
  isPreviewMode?: boolean;
  isNew?: boolean;
  onQuestionChange?: (id: string, data: any) => void;
  onAnswerChange?: (questionId: string, answer: any) => void;
  answer?: any;
}

const Item = ({
  item,
  isOver,
  isPreviewMode = false,
  isNew = false,
  onQuestionChange,
  onAnswerChange,
  answer,
}: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Translate.toString(transform),
    transition,
    touchAction: "none",
  };

  const renderQuestion = () => {
    switch (item.type) {
      case "text":
        return (
          <TextQuestion
            question={item}
            onQuestionChange={(id, data) => onQuestionChange?.(id, data)}
            isPreviewMode={isPreviewMode}
            onAnswerChange={onAnswerChange}
            answer={answer}
          />
        );
      case "mcq":
        return (
          <MCQQuestion
            question={item as MCQQuestionType}
            onQuestionChange={(id, data) => onQuestionChange?.(id, data)}
            isPreviewMode={isPreviewMode}
            onAnswerChange={onAnswerChange}
            answer={answer}
          />
        );
      case "table":
        return (
          <TableQuestion
            question={item as TableQuestionType}
            onQuestionChange={(id, data) => onQuestionChange?.(id, data)}
            isPreviewMode={isPreviewMode}
            onAnswerChange={onAnswerChange}
            answer={answer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded outline gap-1 p-1 flex items-center ${
        isOver ? "is-over" : ""
      } ${isNew ? "is-new" : ""} ${isPreviewMode ? "preview-item" : ""}
`}
    >
      {!isPreviewMode && (
        <div className="drag-handle">
          <IconButton iconProps={{ iconName: "GripperBarVertical" }} />
        </div>
      )}
      {isNew ? <p>{item.type}</p> : renderQuestion()}
    </div>
  );
};

export default Item;
