// @flow
import type { Rect, Position } from 'css-box-model';

type Args = {|
  containerY: Rect,
  containerX: Rect,
  subject: Rect,
  proposedScroll: Position,
|};

export default ({
  containerX,
  containerY,
  subject,
  proposedScroll,
}: Args): ?Position => {
  const isTooBigVertically: boolean = subject.height > containerY.height;
  const isTooBigHorizontally: boolean = subject.width > containerX.width;

  // not too big on any axis
  if (!isTooBigHorizontally && !isTooBigVertically) {
    return proposedScroll;
  }

  // too big on both axis
  if (isTooBigHorizontally && isTooBigVertically) {
    return null;
  }

  // Only too big on one axis
  // Exclude the axis that we cannot scroll on
  return {
    x: isTooBigHorizontally ? 0 : proposedScroll.x,
    y: isTooBigVertically ? 0 : proposedScroll.y,
  };
};
