import keyIsCurrentlyTriggeringEvent from '../helpers/parsing-key-maps/keyIsCurrentlyTriggeringEvent';
import KeyEventSequenceIndex from '../const/KeyEventSequenceIndex';
import Configuration from './Configuration';
import size from '../utils/collection/size';

class KeySequenceMatcher {
  constructor() {
    this._combinations = {};
  }

  addCombination(combinationSchema, handler) {
    if (this._includesMatcherForCombination(combinationSchema.id)) {
      const { eventRecordIndex, actionName, id } = combinationSchema;
      this._addEventHandlerToCombination(id, { eventRecordIndex, actionName, handler });
    } else {
      this._addNewCombination(combinationSchema, handler);
    }
  }

  findMatch(keyCombinationRecord, key, eventRecordIndex) {
    if (!this._order) {
      this._setOrder();
    }

    let combinationIndex = 0;

    while (combinationIndex < this._order.length) {
      const combinationId = this._order[combinationIndex];
      const combinationMatcher = this._combinations[combinationId];

      if (canBeMatched(keyCombinationRecord, combinationMatcher)) {
        if (this._combinationMatchesKeys(keyCombinationRecord, key, combinationMatcher, eventRecordIndex)) {
          return combinationMatcher;
        }
      }

      combinationIndex++;
    }

    return null;
  }

  _combinationMatchesKeys(keyCombinationRecord, keyBeingPressed, combinationMatch, eventRecordIndex) {
    const combinationHasHandlerForEventType =
      combinationMatch.events[eventRecordIndex];

    if (!combinationHasHandlerForEventType) {
      /**
       * If the combination does not have any actions bound to the key event we are
       * currently processing, we skip checking if it matches the current keys being
       * pressed.
       */
      return false;
    }

    let keyCompletesCombination = false;

    const combinationMatchesKeysPressed = Object.keys(combinationMatch.keyDictionary).every((candidateKeyName) => {
      const keyState = keyCombinationRecord.getKeyState(candidateKeyName);

      if (keyState) {
        if (keyIsCurrentlyTriggeringEvent(keyState, eventRecordIndex)) {
          if (keyBeingPressed && (keyBeingPressed === keyCombinationRecord.getNormalizedKeyName(candidateKeyName))) {
            keyCompletesCombination =
              !keyAlreadyTriggeredEvent(keyState, eventRecordIndex);
          }

          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });

    return combinationMatchesKeysPressed && keyCompletesCombination;
  }

  _setOrder() {
    /**
     * The first time the component that is currently handling the key event has
     * its handlers searched for a match, order the combinations based on their
     * size so that they may be applied in the correct priority order
     */

    const combinationsPartitionedBySize = Object.values(this._combinations).reduce((memo, {id, size}) => {
      if (!memo[size]) {
        memo[size] = [];
      }

      memo[size].push(id);

      return memo;
    }, {});

    this._order = Object.keys(combinationsPartitionedBySize).sort((a, b) => b - a).reduce((memo, key) => {
      return memo.concat(combinationsPartitionedBySize[key]);
    }, []);
  }

  _addNewCombination(combinationSchema, handler) {
    const {
      prefix, sequenceLength, id, keyDictionary, size, eventRecordIndex, actionName
    } = combinationSchema;

    this._setCombinationMatcher(id, {
      prefix, sequenceLength, id, keyDictionary, size,
      events: { }
    });

    this._addEventHandlerToCombination(id, { eventRecordIndex, actionName, handler })
  }

  _addEventHandlerToCombination(id, { eventRecordIndex, actionName, handler }) {
    const combination = this._getCombinationMatcher(id);

    this._setCombinationMatcher(id, {
      ...combination,
      events: {
        ...combination.events,
        [eventRecordIndex]: {
          actionName, eventRecordIndex, handler
        }
      }
    });
  }

  _setCombinationMatcher(id, combinationMatcher) {
    this._combinations[id] = combinationMatcher;
  }

  _getCombinationMatcher(id) {
    return this._combinations[id];
  }

  _includesMatcherForCombination(id) {
    return !!this._getCombinationMatcher(id);
  }
}

function keyAlreadyTriggeredEvent(keyState, eventRecordIndex) {
  return keyState && keyState[KeyEventSequenceIndex.previous][eventRecordIndex];
}

function canBeMatched(keyCombinationRecord, combinationMatcher) {
  const combinationKeysNo = size(combinationMatcher.keyDictionary);

  if (Configuration.option('allowCombinationSubmatches')) {
    return keyCombinationRecord.getNumberOfKeys() >= combinationKeysNo;
  } else {
    /**
     * If sub-matches are not allow, the number of keys in the key state and the
     * number of keys in the combination we are attempting to match, must be
     * exactly the same
     */
    return keyCombinationRecord.getNumberOfKeys() === combinationKeysNo;
  }
}

export default KeySequenceMatcher;
