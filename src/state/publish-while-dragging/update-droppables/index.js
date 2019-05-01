// @flow
import invariant from 'tiny-invariant';
import {
  withScroll,
  createBox,
  type BoxModel,
  type Spacing,
  type Rect,
} from 'css-box-model';
import getDroppableDimension, {
  type Closest,
} from '../../droppable/get-droppable';
import type {
  Viewport,
  DroppableDimension,
  DroppableDimensionMap,
  Scrollable,
  Axis,
} from '../../../types';
import { isEqual } from '../../spacing';
import scrollDroppable from '../../droppable/scroll-droppable';
import { removePlaceholder } from '../../droppable/with-placeholder';
import getFrame from '../../get-frame';
import { toDroppableMap } from '../../dimension-structures';

const throwIfSpacingChange = (old: BoxModel, fresh: BoxModel) => {
  if (process.env.NODE_ENV !== 'production') {
    const getMessage = (spacingType: string) =>
      `Cannot change the ${spacingType} of a Droppable during a drag`;
    invariant(isEqual(old.margin, fresh.margin), getMessage('margin'));
    invariant(isEqual(old.border, fresh.border), getMessage('border'));
    invariant(isEqual(old.padding, fresh.padding), getMessage('padding'));
  }
};

const adjustBorderBoxSize = (axis: Axis, old: Rect, fresh: Rect): Spacing => ({
  // top and left positions cannot change
  top: old.top,
  left: old.left,
  // this is the main logic of this function - the size adjustment
  right: old.left + fresh.width,
  bottom: old.top + fresh.height,
});

type Args = {|
  existing: DroppableDimensionMap,
  modified: DroppableDimension[],
  viewport: Viewport,
|};

export default ({
  modified,
  existing,
  viewport,
}: Args): DroppableDimensionMap => {
  // dynamically adjusting the client subject and page subject
  // of a droppable in response to dynamic additions and removals

  // No existing droppables modified
  if (!modified.length) {
    return existing;
  }

  const adjusted: DroppableDimension[] = modified.map(
    (provided: DroppableDimension): DroppableDimension => {
      const raw: ?DroppableDimension = existing[provided.descriptor.id];
      invariant(raw, 'Could not locate droppable in existing droppables');

      const hasPlaceholder: boolean = Boolean(raw.subject.withPlaceholder);

      const dimension: DroppableDimension = hasPlaceholder
        ? removePlaceholder(raw)
        : raw;

      const oldClientX: BoxModel = dimension.clientX;
      const newClientX: BoxModel = provided.clientX;
      const oldClientY: BoxModel = dimension.clientY;
      const newClientY: BoxModel = provided.clientY;
      const oldScrollable: Scrollable = getFrame(dimension);
      const newScrollable: Scrollable = getFrame(provided);

      // Extra checks to help with development
      if (process.env.NODE_ENV !== 'production') {
        throwIfSpacingChange(dimension.clientX, provided.clientX);
        throwIfSpacingChange(
          oldScrollable.frameClientX,
          newScrollable.frameClientX,
        );

        const isFrameEqual: boolean =
          oldScrollable.frameClientX.borderBox.height ===
            newScrollable.frameClientX.borderBox.height &&
          oldScrollable.frameClientX.borderBox.width ===
            newScrollable.frameClientX.borderBox.width;

        invariant(
          isFrameEqual,
          'The width and height of your Droppable scroll container cannot change when adding or removing Draggables during a drag',
        );
        throwIfSpacingChange(dimension.clientY, provided.clientY);
        throwIfSpacingChange(
          oldScrollable.frameClientY,
          newScrollable.frameClientY,
        );

        const isFrameEqual2: boolean =
          oldScrollable.frameClientY.borderBox.height ===
            newScrollable.frameClientY.borderBox.height &&
          oldScrollable.frameClientY.borderBox.width ===
            newScrollable.frameClientY.borderBox.width;

        invariant(
          isFrameEqual2,
          'The width and height of your Droppable scroll container cannot change when adding or removing Draggables during a drag',
        );
      }

      const clientX: BoxModel = createBox({
        borderBox: adjustBorderBoxSize(
          dimension.axis,
          oldClientX.borderBox,
          newClientX.borderBox,
        ),
        margin: oldClientX.margin,
        border: oldClientX.border,
        padding: oldClientX.padding,
      });

      const clientY: BoxModel = createBox({
        borderBox: adjustBorderBoxSize(
          dimension.axis,
          oldClientY.borderBox,
          newClientY.borderBox,
        ),
        margin: oldClientY.margin,
        border: oldClientY.border,
        padding: oldClientY.padding,
      });

      const closest: Closest = {
        // not allowing a change to the scrollable frame size during a drag
        clientX: oldScrollable.frameClientX,
        clientY: oldScrollable.frameClientY,
        pageX: withScroll(oldScrollable.frameClientX, viewport.scroll.initial),
        pageY: withScroll(oldScrollable.frameClientY, viewport.scroll.initial),
        shouldClipSubject: oldScrollable.shouldClipSubject,
        // the scroll size can change during a drag
        scrollSize: newScrollable.scrollSize,
        // using the initial scroll point
        scroll: oldScrollable.scroll.initial,
      };

      const withSizeChanged: DroppableDimension = getDroppableDimension({
        descriptor: provided.descriptor,
        isEnabled: provided.isEnabled,
        isCombineEnabled: provided.isCombineEnabled,
        isFixedOnPage: provided.isFixedOnPage,
        direction: provided.axis.direction,
        clientX,
        clientY,
        pageX: withScroll(clientX, viewport.scroll.initial),
        pageY: withScroll(clientY, viewport.scroll.initial),
        closest,
      });

      const scrolled: DroppableDimension = scrollDroppable(
        withSizeChanged,
        // TODO: use .initial - i guess both work though..
        newScrollable.scroll.current,
      );

      return scrolled;
    },
  );

  const result: DroppableDimensionMap = {
    ...existing,
    // will override any conflicts with existing
    ...toDroppableMap(adjusted),
  };

  return result;
};
