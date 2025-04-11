import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { ItemType, ContainerType } from "./type";
import { ReactNode } from "react";
import {
  ITextFieldStyles,
  TextField,
  IconButton,
  initializeIcons,
} from "@fluentui/react";

initializeIcons();

interface Props {
  container: ContainerType;
  items: ItemType[];
  children: ReactNode;
  isNew?: boolean;
  isPreviewMode?: boolean;
  handleHeaderChange: (value: string, id: string) => void;
  isOver?: boolean;
}

const Section = ({
  container,
  items,
  children,
  isNew,
  isPreviewMode = false,
  handleHeaderChange,
  isOver = false,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: container.id });
  const { setNodeRef: setDragHandleRef } = useDraggable({
    id: container.id,
  });

  const style =
    transform && transition
      ? {
          transform: CSS.Transform.toString(transform),
          transition,
        }
      : undefined;

  const sectionHeaderStyles: Partial<ITextFieldStyles> = {
    field: {
      fontSize: "1.5rem",
      fontWeight: 600,
      color: "#666",
    },
  };

  return (
    <SortableContext id={container.id} items={items}>
      <div
        className={`rounded outline gap-8 p-2 ${isOver ? "top-outline" : ""} ${
          isPreviewMode ? "preview-section" : ""
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
              {isNew ? (
                <></>
              ) : (
                <IconButton
                  iconProps={{ iconName: "GripperBarVertical" }}
                  title="Drag"
                  ariaLabel="Drag"
                />
              )}
            </div>
          )}
          <div className="flex-1">
            {isNew ? (
              <h2 className="text-xl font-semibold">{container.header}</h2>
            ) : isPreviewMode ? (
              <h2 className="text-xl font-semibold">
                {container.header || "Untitled Section"}
              </h2>
            ) : (
              <TextField
                value={container.header}
                onChange={(_, newValue) => {
                  console.log("TextField onChange:", newValue, container.id);
                  if (newValue !== undefined) {
                    handleHeaderChange(newValue, container.id);
                  }
                }}
                styles={sectionHeaderStyles}
                underlined
                placeholder="Untitled Section"
              />
            )}
          </div>
        </div>
        {children}
      </div>
    </SortableContext>
  );
};

export default Section;
