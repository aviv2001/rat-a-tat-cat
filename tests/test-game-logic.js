/**
 * Comprehensive Test Suite for Rat-a-Tat Cat Game Logic
 * Focus: Swap Card Functionality
 */

const { RatATatCatGame, Card, Player } = require('../src/GameLogic.js');

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        testsPassed++;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        testsFailed++;
    }
}

function assertEquals(actual, expected, testName) {
    if (actual === expected) {
        console.log(`✅ PASS: ${testName}`);
        testsPassed++;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   Expected: ${expected}`);
        console.log(`   Actual: ${actual}`);
        testsFailed++;
    }
}

function assertNotNull(value, testName) {
    if (value !== null && value !== undefined) {
        console.log(`✅ PASS: ${testName}`);
        testsPassed++;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   Value was null or undefined`);
        testsFailed++;
    }
}

// Helper function to setup a basic game
function setupBasicGame() {
    const game = new RatATatCatGame('TEST-GAME');
    game.addPlayer('player1', 'Alice');
    game.addPlayer('player2', 'Bob');
    game.startRound();
    return game;
}

// Helper to force draw a specific card
function forceDrawSwapCard(game) {
    // Save current drawn card state
    const swapCard = new Card('swap');
    game.drawnCard = swapCard;
    game.drawnFromDiscard = false;
    return swapCard;
}

// ============ SWAP CARD TESTS ============

console.log('\n🧪 SWAP CARD FUNCTIONALITY TESTS\n');
console.log('='.repeat(50));

// Test 1: Basic swap functionality
console.log('\n📋 Test Group: Basic Swap Functionality');
{
    const game = setupBasicGame();
    const player1 = game.players[0];
    const player2 = game.players[1];

    // Record original cards
    const p1OriginalCard = player1.hand[0];
    const p2OriginalCard = player2.hand[1];

    forceDrawSwapCard(game);

    const result = game.useSwap(0, player2.id, 1);

    assert(result.success, 'Swap should succeed with valid parameters');
    assertEquals(player1.hand[0], p2OriginalCard, 'Player 1 should have Player 2\'s card');
    assertEquals(player2.hand[1], p1OriginalCard, 'Player 2 should have Player 1\'s card');
    assertEquals(player1.knownCards[0], false, 'Player 1\'s swapped card should be unknown');
    assertEquals(player2.knownCards[1], false, 'Player 2\'s swapped card should be unknown');
    assertEquals(game.drawnCard, null, 'Drawn card should be cleared after swap');
}

// Test 2: Swap is optional - decline functionality
console.log('\n📋 Test Group: Optional Swap (Decline)');
{
    const game = setupBasicGame();
    const player1 = game.players[0];
    const player2 = game.players[1];

    // Record original cards
    const p1Cards = [...player1.hand];
    const p2Cards = [...player2.hand];

    forceDrawSwapCard(game);

    const result = game.declineSwap();

    assert(result.success, 'Declining swap should succeed');

    // Verify no cards were swapped
    for (let i = 0; i < player1.hand.length; i++) {
        assertEquals(player1.hand[i], p1Cards[i], `Player 1 card ${i} should remain unchanged`);
    }
    for (let i = 0; i < player2.hand.length; i++) {
        assertEquals(player2.hand[i], p2Cards[i], `Player 2 card ${i} should remain unchanged`);
    }

    assertEquals(game.drawnCard, null, 'Drawn card should be cleared after declining');
}

// Test 3: Cannot swap with yourself
console.log('\n📋 Test Group: Self-Swap Prevention');
{
    const game = setupBasicGame();
    const player1 = game.players[0];

    forceDrawSwapCard(game);

    const result = game.useSwap(0, player1.id, 1);

    assertEquals(result.success, false, 'Swap with yourself should fail');
    assertEquals(result.error, 'Cannot swap with yourself', 'Should return correct error message');
    assertNotNull(game.drawnCard, 'Drawn card should still exist after failed swap');
}

// Test 4: Invalid card indices
console.log('\n📋 Test Group: Invalid Card Index Validation');
{
    const game = setupBasicGame();
    const player1 = game.players[0];
    const player2 = game.players[1];

    forceDrawSwapCard(game);

    // Test invalid own card index
    let result = game.useSwap(-1, player2.id, 0);
    assertEquals(result.success, false, 'Swap with negative own card index should fail');

    forceDrawSwapCard(game);
    result = game.useSwap(10, player2.id, 0);
    assertEquals(result.success, false, 'Swap with out-of-bounds own card index should fail');

    // Test invalid opponent card index
    forceDrawSwapCard(game);
    result = game.useSwap(0, player2.id, -1);
    assertEquals(result.success, false, 'Swap with negative opponent card index should fail');

    forceDrawSwapCard(game);
    result = game.useSwap(0, player2.id, 10);
    assertEquals(result.success, false, 'Swap with out-of-bounds opponent card index should fail');
}

// Test 5: Invalid opponent ID
console.log('\n📋 Test Group: Invalid Opponent Validation');
{
    const game = setupBasicGame();

    forceDrawSwapCard(game);

    const result = game.useSwap(0, 'invalid-player-id', 0);

    assertEquals(result.success, false, 'Swap with invalid opponent ID should fail');
    assertEquals(result.error, 'Invalid opponent', 'Should return correct error message');
}

// Test 6: Cannot use swap without drawing it
console.log('\n📋 Test Group: Swap Card Must Be Drawn');
{
    const game = setupBasicGame();
    const player2 = game.players[1];

    // Don't draw any card
    game.drawnCard = null;

    const result = game.useSwap(0, player2.id, 0);

    assertEquals(result.success, false, 'Swap should fail when no card is drawn');
    assertEquals(result.error, 'No swap card drawn', 'Should return correct error message');
}

// Test 7: Cannot use swap with wrong card type
console.log('\n📋 Test Group: Must Have Swap Card Type');
{
    const game = setupBasicGame();
    const player2 = game.players[1];

    // Draw a different card type
    game.drawnCard = new Card('peek');

    const result = game.useSwap(0, player2.id, 0);

    assertEquals(result.success, false, 'Swap should fail with non-swap card');
    assertEquals(result.error, 'No swap card drawn', 'Should return correct error message');
}

// Test 8: Turn ends after successful swap
console.log('\n📋 Test Group: Turn Management');
{
    const game = setupBasicGame();
    const player2 = game.players[1];
    const initialPlayerIndex = game.currentPlayerIndex;

    forceDrawSwapCard(game);
    game.useSwap(0, player2.id, 0);

    const newPlayerIndex = game.currentPlayerIndex;
    assert(newPlayerIndex !== initialPlayerIndex, 'Turn should change after successful swap');
}

// Test 9: Turn ends after declining swap
console.log('\n📋 Test Group: Turn Management (Decline)');
{
    const game = setupBasicGame();
    const initialPlayerIndex = game.currentPlayerIndex;

    forceDrawSwapCard(game);
    game.declineSwap();

    const newPlayerIndex = game.currentPlayerIndex;
    assert(newPlayerIndex !== initialPlayerIndex, 'Turn should change after declining swap');
}

// Test 10: Swap card is discarded after use
console.log('\n📋 Test Group: Card Discard Management');
{
    const game = setupBasicGame();
    const player2 = game.players[1];
    const initialDiscardSize = game.discardPile.length;

    forceDrawSwapCard(game);
    game.useSwap(0, player2.id, 0);

    assertEquals(game.discardPile.length, initialDiscardSize + 1, 'Swap card should be in discard pile');
    const topDiscard = game.discardPile[game.discardPile.length - 1];
    assertEquals(topDiscard.type, 'swap', 'Top of discard should be swap card');
}

// Test 11: Swap card is discarded after decline
console.log('\n📋 Test Group: Card Discard Management (Decline)');
{
    const game = setupBasicGame();
    const initialDiscardSize = game.discardPile.length;

    forceDrawSwapCard(game);
    game.declineSwap();

    assertEquals(game.discardPile.length, initialDiscardSize + 1, 'Swap card should be in discard pile after decline');
    const topDiscard = game.discardPile[game.discardPile.length - 1];
    assertEquals(topDiscard.type, 'swap', 'Top of discard should be swap card');
}

// Test 12: Swap works with cards at different hand positions
console.log('\n📋 Test Group: Various Hand Positions');
{
    const game = setupBasicGame();
    const player1 = game.players[0];
    const player2 = game.players[1];

    // Test swapping different positions
    for (let i = 0; i < player1.hand.length; i++) {
        for (let j = 0; j < player2.hand.length; j++) {
            const testGame = setupBasicGame();
            const p1 = testGame.players[0];
            const p2 = testGame.players[1];

            const p1Card = p1.hand[i];
            const p2Card = p2.hand[j];

            forceDrawSwapCard(testGame);
            const result = testGame.useSwap(i, p2.id, j);

            assert(result.success, `Swap should succeed for positions p1[${i}] <-> p2[${j}]`);
            assertEquals(p1.hand[i], p2Card, `P1[${i}] should have P2's card`);
            assertEquals(p2.hand[j], p1Card, `P2[${j}] should have P1's card`);
        }
    }
}

// Test 13: Multiple swaps in a game
console.log('\n📋 Test Group: Multiple Swaps Across Turns');
{
    const game = setupBasicGame();
    const player1 = game.players[0];
    const player2 = game.players[1];

    // First swap
    forceDrawSwapCard(game);
    game.currentPlayerIndex = 0; // Reset to player 1
    let result = game.useSwap(0, player2.id, 0);
    assert(result.success, 'First swap should succeed');

    // Second swap (different turn)
    forceDrawSwapCard(game);
    game.currentPlayerIndex = 0; // Reset to player 1
    result = game.useSwap(1, player2.id, 1);
    assert(result.success, 'Second swap should succeed');

    // Third swap
    forceDrawSwapCard(game);
    game.currentPlayerIndex = 0; // Reset to player 1
    result = game.useSwap(2, player2.id, 2);
    assert(result.success, 'Third swap should succeed');
}

// Test 14: Swap with more than 2 players
console.log('\n📋 Test Group: Multi-Player Swaps');
{
    const game = new RatATatCatGame('TEST-MULTI');
    game.addPlayer('p1', 'Alice');
    game.addPlayer('p2', 'Bob');
    game.addPlayer('p3', 'Charlie');
    game.addPlayer('p4', 'Diana');
    game.startRound();

    const p1 = game.players[0];
    const p3 = game.players[2];

    const p1Card = p1.hand[1];
    const p3Card = p3.hand[2];

    forceDrawSwapCard(game);
    const result = game.useSwap(1, p3.id, 2);

    assert(result.success, 'Swap should work in 4-player game');
    assertEquals(p1.hand[1], p3Card, 'P1 should have P3\'s card');
    assertEquals(p3.hand[2], p1Card, 'P3 should have P1\'s card');
}

// Test 15: Known cards become unknown after swap
console.log('\n📋 Test Group: Card Knowledge Reset');
{
    const game = setupBasicGame();
    const player1 = game.players[0];
    const player2 = game.players[1];

    // Mark cards as known
    player1.knownCards[0] = true;
    player2.knownCards[1] = true;

    forceDrawSwapCard(game);
    game.useSwap(0, player2.id, 1);

    assertEquals(player1.knownCards[0], false, 'P1\'s known card should become unknown after swap');
    assertEquals(player2.knownCards[1], false, 'P2\'s known card should become unknown after swap');
}

// Test 16: Cannot decline non-swap card
console.log('\n📋 Test Group: Decline Validation');
{
    const game = setupBasicGame();

    // Try to decline when no card is drawn
    game.drawnCard = null;
    let result = game.declineSwap();
    assertEquals(result.success, false, 'Cannot decline when no card is drawn');

    // Try to decline with wrong card type
    game.drawnCard = new Card('peek');
    result = game.declineSwap();
    assertEquals(result.success, false, 'Cannot decline non-swap card');
}

// Test 17: Swap returns correct result data
console.log('\n📋 Test Group: Return Value Validation');
{
    const game = setupBasicGame();
    const player2 = game.players[1];

    forceDrawSwapCard(game);
    const result = game.useSwap(0, player2.id, 0);

    assert(result.success, 'Result should have success property');
    assertNotNull(result.swappedWith, 'Result should include swapped opponent name');
    assertEquals(result.swappedWith, player2.name, 'Result should have correct opponent name');
}

// ============ INTEGRATION TESTS ============

console.log('\n📋 Test Group: Integration Tests');

// Test 18: Complete game flow with swap
{
    const game = setupBasicGame();

    // Draw from deck
    const drawResult = game.drawFromDeck();
    assert(drawResult.success, 'Should draw from deck');

    // Replace original drawn card with swap card for testing
    game.drawnCard = new Card('swap');

    // Use swap
    const swapResult = game.useSwap(0, game.players[1].id, 0);
    assert(swapResult.success, 'Should complete swap in game flow');
    assertEquals(game.drawnCard, null, 'Game state should be clean after swap');
}

// ============ EDGE CASES ============

console.log('\n📋 Test Group: Edge Cases');

// Test 19: Swap with Add Card twist (varying hand sizes)
{
    const game = setupBasicGame();
    const player1 = game.players[0];
    const player2 = game.players[1];

    // Add extra card to player 1 (simulating Add Card power)
    player1.addCard(new Card('number', 5));

    const p1Card = player1.hand[4]; // The 5th card
    const p2Card = player2.hand[0];

    forceDrawSwapCard(game);
    const result = game.useSwap(4, player2.id, 0);

    assert(result.success, 'Should swap even with different hand sizes');
    assertEquals(player1.hand[4], p2Card, 'Should swap from extended hand');
    assertEquals(player2.hand[0], p1Card, 'Should swap to normal hand');
}

// Test 20: Rapid consecutive operations
{
    const game = setupBasicGame();

    forceDrawSwapCard(game);
    const result1 = game.useSwap(0, game.players[1].id, 0);

    // Try to swap again immediately (should fail - no card drawn)
    const result2 = game.useSwap(1, game.players[1].id, 1);

    assert(result1.success, 'First swap should succeed');
    assertEquals(result2.success, false, 'Second swap without draw should fail');
}

// ============ TEST SUMMARY ============

console.log('\n' + '='.repeat(50));
console.log('🏁 TEST SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
    process.exit(0);
} else {
    console.log('\n⚠️  SOME TESTS FAILED - Please review the failures above\n');
    process.exit(1);
}
