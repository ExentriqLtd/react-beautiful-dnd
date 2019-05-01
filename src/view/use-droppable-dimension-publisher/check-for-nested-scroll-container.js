// @flow
import getClosestScrollable from './get-closest-scrollable';
import { warning } from '../../dev-warning';
import type { Axis } from './type';

// We currently do not support nested scroll containers
// But will hopefully support this soon!
export default (scrollable: ?Element, axis: Axis) => {
  if (!scrollable) {
    return;
  }

  const anotherScrollParent: ?Element = getClosestScrollable(
    scrollable.parentElement,
    axis,
  );

  if (!anotherScrollParent) {
    return;
  }

  warning(`
    Droppable: unsupported nested scroll container detected.
    A Droppable can only have one scroll parent (which can be itself)
    Nested scroll containers are currently not supported.

    We hope to support nested scroll containers soon: https://github.com/atlassian/react-beautiful-dnd/issues/131
  `);
};
