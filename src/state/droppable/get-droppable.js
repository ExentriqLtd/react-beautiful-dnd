// @flow
import { type BoxModel, type Position } from 'css-box-model';
import type {
  Axis,
  DroppableDimension,
  DroppableDescriptor,
  Scrollable,
  DroppableSubject,
  ScrollSize,
} from '../../types';
import { vertical, horizontal } from '../axis';
import { origin } from '../position';
import getMaxScroll from '../get-max-scroll';
import getSubject from './util/get-subject';

export type Closest = {|
  clientX: BoxModel,
  clientY: BoxModel,
  pageX: BoxModel,
  pageY: BoxModel,
  scroll: Position,
  scrollSize: ScrollSize,
  shouldClipSubject: boolean,
|};

type Args = {|
  descriptor: DroppableDescriptor,
  isEnabled: boolean,
  isCombineEnabled: boolean,
  isFixedOnPage: boolean,
  direction: 'vertical' | 'horizontal',
  clientX: BoxModel,
  clientY: BoxModel,
  // is null when in a fixed container
  pageX: BoxModel,
  pageY: BoxModel,
  closest?: ?Closest,
|};

export default ({
  descriptor,
  isEnabled,
  isCombineEnabled,
  isFixedOnPage,
  direction,
  clientX,
  clientY,
  pageX,
  pageY,
  closest,
}: Args): DroppableDimension => {
  const frame: ?Scrollable = (() => {
    if (!closest) {
      return null;
    }

    const {
      scrollSize,
      clientX: frameClientX,
      clientY: frameClientY,
    } = closest;

    // scrollHeight and scrollWidth are based on the padding box
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
    const maxScroll: Position = getMaxScroll({
      scrollHeight: scrollSize.scrollHeight,
      scrollWidth: scrollSize.scrollWidth,
      height: frameClientY.paddingBox.height,
      width: frameClientX.paddingBox.width,
    });

    return {
      pageXMarginBox: closest.pageX.marginBox,
      pageYMarginBox: closest.pageY.marginBox,
      frameClientX,
      frameClientY,
      scrollSize,
      shouldClipSubject: closest.shouldClipSubject,
      scroll: {
        initial: closest.scroll,
        current: closest.scroll,
        max: maxScroll,
        diff: {
          value: origin,
          displacement: origin,
        },
      },
    };
  })();

  const axis: Axis = direction === 'vertical' ? vertical : horizontal;

  const subject: DroppableSubject = getSubject({
    pageX,
    pageY,
    withPlaceholder: null,
    axis,
    frame,
  });

  const dimension: DroppableDimension = {
    descriptor,
    isCombineEnabled,
    isFixedOnPage,
    axis,
    isEnabled,
    clientX,
    clientY,
    pageX,
    pageY,
    frame,
    subject,
  };

  return dimension;
};
