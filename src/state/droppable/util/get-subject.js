// @flow
import { getRect, type Rect, type Spacing, type BoxModel } from 'css-box-model';
import type {
  Axis,
  Scrollable,
  DroppableSubject,
  PlaceholderInSubject,
} from '../../../types';
import executeClip from './clip';
import { offsetByPosition } from '../../spacing';

const scroll = (target: Spacing, frame: ?Scrollable): Spacing => {
  if (!frame) {
    return target;
  }

  return offsetByPosition(target, frame.scroll.diff.displacement);
};

const increase = (
  target: Spacing,
  axis: Axis,
  withPlaceholder: ?PlaceholderInSubject,
): Spacing => {
  if (withPlaceholder && withPlaceholder.increasedBy) {
    return {
      ...target,
      [axis.end]: target[axis.end] + withPlaceholder.increasedBy[axis.line],
    };
  }
  return target;
};

type AxisS = 'x' | 'y';

const clip = (target: Spacing, frame: ?Scrollable, axis: AxisS): ?Rect => {
  if (frame && frame.shouldClipSubject) {
    return executeClip(frame[`page${axis.toUpperCase()}MarginBox`], target);
  }
  return getRect(target);
};

type Args = {|
  pageX: BoxModel,
  pageY: BoxModel,
  withPlaceholder: ?PlaceholderInSubject,
  axis: Axis,
  frame: ?Scrollable,
|};

export default ({
  pageY,
  pageX,
  withPlaceholder,
  axis,
  frame,
}: Args): DroppableSubject => {
  const scrolledX: Spacing = scroll(pageX.marginBox, frame);
  const scrolledY: Spacing = scroll(pageY.marginBox, frame);
  const increasedX: Spacing = increase(scrolledX, axis, withPlaceholder);
  const increasedY: Spacing = increase(scrolledY, axis, withPlaceholder);
  const clippedX: ?Rect = clip(increasedX, frame, 'x');
  const clippedY: ?Rect = clip(increasedY, frame, 'y');

  return {
    pageX,
    pageY,
    withPlaceholder,
    active:
      clippedY &&
      clippedX &&
      getRect({
        top: clippedY.top,
        bottom: clippedY.bottom,
        left: clippedY.left,
        right: clippedY.right,
      }),
  };
};
