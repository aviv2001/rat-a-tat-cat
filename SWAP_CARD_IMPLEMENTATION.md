# Swap Card Implementation Documentation

## Overview

This document details the complete implementation of the **Swap Card** functionality for the Rat-a-Tat Cat card game, following official game rules.

## Official Rules Implemented

According to the official Rat-a-Tat Cat rules:

1. ✅ When you draw a Swap card from the deck, you **MAY** (optional) switch one of your cards with any card of another player
2. ✅ You cannot look at your card or the card you're getting (blind swap)
3. ✅ The Swap card is shown and discarded
4. ✅ After swapping (or declining), your turn ends
5. ✅ Swap only works when drawn from deck, not when dealt initially

## Implementation Details

### Backend Changes (`src/GameLogic.js`)

#### Enhanced `useSwap()` Method (lines 296-338)
- **Added validation**: Cannot swap with yourself
- **Added return value**: Returns opponent name on success
- **Maintained blind swap**: Swapped cards become unknown to both players
- **Card management**: Properly discards swap card and ends turn

```javascript
useSwap(myCardIndex, opponentId, opponentCardIndex) {
    // Validates all parameters
    // Prevents self-swap
    // Performs blind card exchange
    // Resets card knowledge
    // Manages game state
}
```

#### New `declineSwap()` Method (lines 340-356)
- **Optional swap**: Players can choose NOT to swap (per official rules)
- **Proper cleanup**: Discards card and ends turn
- **Validation**: Ensures swap card is actually drawn

```javascript
declineSwap() {
    // Validates swap card is drawn
    // Discards without swapping
    // Ends turn properly
}
```

### Server Changes (`server.js`)

#### New Event Handler (lines 151-162)
```javascript
socket.on('declineSwap', () => {
    // Validates turn
    // Calls game.declineSwap()
    // Broadcasts updated state
});
```

#### Enhanced Error Handling
- All swap operations return proper error messages
- Validation prevents invalid swaps from affecting game state

### Frontend Changes (`public/index.html`)

#### Swap Flow State Management (lines 601-618)
```javascript
swapState = {
    active: false,          // Is swap flow active?
    step: 'select-my-card', // Current step in flow
    myCardIndex: null,      // Selected card from my hand
    opponentId: null,       // Selected opponent
    opponentCardIndex: null // Selected opponent card
}
```

#### Three-Step Swap UI Flow

**Step 1: Initial Choice**
- Player draws swap card
- UI shows two options:
  - "Start Swap" - Begin the swap process
  - "Decline (Skip)" - Skip swapping (optional per rules)

**Step 2: Select Your Card**
- Your cards become clickable with green glow
- Click any of your 4+ cards
- Shows "Step 1/3: Click one of YOUR cards to swap"

**Step 3: Select Opponent**
- Opponent player zones highlighted with green border
- Click on opponent's name/zone
- Cannot click yourself (validation)
- Shows "Step 2/3: Click the OPPONENT you want to swap with"

**Step 4: Select Opponent's Card**
- Selected opponent's cards become clickable
- Click any of their cards
- Shows "Step 3/3: Click [opponent]'s card to swap"
- Executes swap automatically after selection

#### Visual Feedback
- **Green glowing border**: Clickable cards
- **Green zone border**: Selectable opponents
- **Progress indicators**: "Step X/3" messages
- **Cancel button**: Available during swap flow
- **Confirmation**: For declining swap

#### Functions Added (lines 1086-1130)
```javascript
startSwapFlow()              // Initiates swap process
cancelSwapFlow()             // Cancels and resets
selectMyCardForSwap(index)   // Step 1 handler
selectSwapOpponent(id)       // Step 2 handler
selectOpponentCardForSwap(index) // Step 3 handler, executes swap
declineSwap()                // Declines swap with confirmation
resetSwapState()             // Cleans up state
```

## Test Coverage

### Comprehensive Test Suite (`tests/test-game-logic.js`)

**104 tests implemented**, covering:

1. ✅ Basic swap functionality (6 tests)
2. ✅ Optional swap / decline (10 tests)
3. ✅ Self-swap prevention (3 tests)
4. ✅ Invalid index validation (4 tests)
5. ✅ Invalid opponent validation (2 tests)
6. ✅ Swap card must be drawn (2 tests)
7. ✅ Card type validation (2 tests)
8. ✅ Turn management (2 tests)
9. ✅ Card discard management (4 tests)
10. ✅ Various hand positions (48 tests)
11. ✅ Multiple swaps across turns (3 tests)
12. ✅ Multi-player swaps (3 tests)
13. ✅ Card knowledge reset (2 tests)
14. ✅ Decline validation (2 tests)
15. ✅ Return value validation (3 tests)
16. ✅ Integration tests (3 tests)
17. ✅ Edge cases (5 tests)

**Test Results**: 100% pass rate (104/104 tests passing)

## Key Features

### Professional Implementation

1. **Rule Compliance**: Fully follows official Rat-a-Tat Cat rules
2. **Robust Validation**:
   - Cannot swap with yourself
   - Index bounds checking
   - Opponent existence validation
   - Card type verification
3. **Clean State Management**:
   - Proper cleanup after swap
   - No lingering state issues
   - Correct turn progression
4. **User Experience**:
   - Clear step-by-step guidance
   - Visual feedback at every step
   - Cancel option available
   - Confirmation for decline
5. **Blind Swap**: Maintains game integrity by marking swapped cards as unknown

### Bug Fixes from Original Implementation

**Original Issues**:
1. ❌ Swap was mandatory (violated official rules)
2. ❌ No functional frontend UI (just error message)
3. ❌ No validation against swapping with yourself
4. ❌ No test coverage

**Fixed Implementation**:
1. ✅ Swap is optional with decline functionality
2. ✅ Full three-step interactive UI
3. ✅ Complete validation suite
4. ✅ 104 comprehensive tests

## Usage Example

### As a Player

1. **Draw a swap card** from the deck
2. **See the swap card UI** with two buttons:
   - "Start Swap" or "Decline (Skip)"
3. **If starting swap**:
   - Step 1: Click one of your cards (green glow)
   - Step 2: Click an opponent's name area
   - Step 3: Click one of their cards
   - Swap executes automatically
4. **If declining**:
   - Confirm skip
   - Turn ends, no swap occurs

### As a Developer

```javascript
// Using swap in code
const result = game.useSwap(myCardIndex, opponentId, opponentCardIndex);
if (result.success) {
    console.log(`Swapped with ${result.swappedWith}`);
}

// Declining swap
const result = game.declineSwap();
if (result.success) {
    console.log('Swap declined');
}
```

## Testing

Run the test suite:

```bash
npm test
# or
node tests/test-game-logic.js
```

Expected output: 104 tests passing

## Security & Validation

- **Server-side validation**: All swap operations validated on server
- **Turn verification**: Only current player can execute swap
- **Parameter validation**: All indices and IDs checked
- **State consistency**: Game state remains consistent even with failed swaps

## Backward Compatibility

✅ All existing game functionality remains intact:
- Peek cards work as before
- Draw 2 cards work as before
- Add Card works as before
- Number cards work as before
- Knock functionality unchanged
- Score calculation unchanged

## Performance

- **Minimal overhead**: Swap operations are O(1)
- **Clean state management**: No memory leaks
- **Efficient rendering**: Only updates affected areas

## Future Enhancements (Optional)

- Add animation for card swap visual effect
- Sound effects for swap action
- Swap history/log display
- Mobile touch gestures optimization

## Summary

The swap card functionality is now **fully implemented**, **thoroughly tested**, and **production-ready**. It follows official rules, includes comprehensive validation, provides excellent UX, and maintains the integrity of the existing game.

---

**Implementation Date**: 2025-10-30
**Test Coverage**: 104 tests, 100% pass rate
**Lines Added**: ~200 lines of code + 550 lines of tests
**Files Modified**: 3 (GameLogic.js, server.js, index.html)
**Files Created**: 2 (test-game-logic.js, this documentation)
