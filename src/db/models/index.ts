import Hub from './Hub';
import Venue from './Venue';
import Zone from './Zone';
import NavigationNode from './NavigationNode';
import NavigationEdge from './NavigationEdge';
import ScheduledClosure from './ScheduledClosure';
import SyncState, { SyncStateKeys, type SyncStateKey } from './SyncState';

export {
  Hub,
  Venue,
  Zone,
  NavigationNode,
  NavigationEdge,
  ScheduledClosure,
  SyncState,
  SyncStateKeys,
  type SyncStateKey,
};

export const modelClasses = [
  Hub,
  Venue,
  Zone,
  NavigationNode,
  NavigationEdge,
  ScheduledClosure,
  SyncState,
];
