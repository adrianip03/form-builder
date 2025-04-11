import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { IconButton } from "@fluentui/react";
import { initializeIcons } from "@fluentui/react";
import {
  ItemType,
  TextQuestionType,
  MCQQuestionType,
  TableQuestionType,
} from "./type";
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
}

const Item = ({
  item,
  isOver,
  isPreviewMode = false,
  isNew = false,
  onQuestionChange,
}: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({ id: item.id });
  const { setNodeRef: setDragHandleRef } = useDraggable({
    id: item.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const renderQuestion = () => {
    switch (item.type) {
      case "text":
        return (
          <TextQuestion
            question={item as TextQuestionType}
            onQuestionChange={(id, question) =>
              onQuestionChange?.(id, { question })
            }
            isPreviewMode={isPreviewMode}
          />
        );
      case "mcq":
        return (
          <MCQQuestion
            question={item as MCQQuestionType}
            onQuestionChange={(id, choices) =>
              onQuestionChange?.(id, { choices })
            }
            isPreviewMode={isPreviewMode}
          />
        );
      case "table":
        return (
          <TableQuestion
            question={item as TableQuestionType}
            onQuestionChange={(id, columns) =>
              onQuestionChange?.(id, { columns })
            }
            isPreviewMode={isPreviewMode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        className={`rounded outline gap-1 p-1 ${isOver ? "top-outline" : ""} ${
          isPreviewMode ? "preview-item" : ""
        }`}
        ref={(node) => {
          setNodeRef(node);
          setDragHandleRef(node);
        }}
        style={style}
        {...attributes}
      >
        <div className="flex items-center gap-2">
          {!isPreviewMode && (
            <div {...listeners}>
              <IconButton
                iconProps={{ iconName: "GripperBarVertical" }}
                title="Drag"
                ariaLabel="Drag"
              />
            </div>
          )}
          <div className="flex-1">
            {isNew ? <p>{item.type}</p> : renderQuestion()}
          </div>
        </div>
      </div>
    </>
  );
};

export const InvisibleDropTarget = ({
  isOver,
  id,
}: {
  isOver: boolean;
  id: string;
}) => {
  const { attributes, listeners, setNodeRef } = useSortable({
    id: id,
    disabled: true,
  });

  return (
    <>
      <div
        className={`rounded p-2 gap-1 ${isOver ? "top-outline" : ""}`}
        ref={setNodeRef}
        {...attributes}
        {...listeners}
      >
        <p>{}</p>
      </div>
    </>
  );
};

export default Item;
