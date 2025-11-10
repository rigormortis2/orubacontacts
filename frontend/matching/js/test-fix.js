/**
 * Quick Test for TypeError Fix
 * This demonstrates the fix resolves the forEach error
 */

// Simulate the backend response format
const mockBackendResponse = {
  jobTitles: [
    { id: 1, title: 'Doctor' },
    { id: 2, title: 'Nurse' },
    { id: 3, title: 'Administrator' }
  ]
};

// BEFORE FIX - This would have caused the error
function oldLoadJobTitles() {
  const jobTitles = mockBackendResponse; // Wrong: storing entire object
  console.log('OLD WAY - Type check:', typeof jobTitles, Array.isArray(jobTitles));
  try {
    jobTitles.forEach(item => console.log(item)); // TypeError!
  } catch (error) {
    console.error('ERROR (expected):', error.message);
  }
}

// AFTER FIX - This works correctly
function newLoadJobTitles() {
  const jobTitles = mockBackendResponse.jobTitles || []; // Correct: extracting array
  console.log('\nNEW WAY - Type check:', typeof jobTitles, Array.isArray(jobTitles));
  try {
    jobTitles.forEach(item => console.log('Job Title:', item.title)); // Works!
    console.log('SUCCESS: forEach works correctly');
  } catch (error) {
    console.error('ERROR (unexpected):', error.message);
  }
}

// UI.js defensive coding test
function testDefensiveCoding(input, description) {
  console.log(`\nTesting ${description}:`);
  const safeArray = Array.isArray(input) ? input : [];
  console.log('Input:', input);
  console.log('Safe array:', safeArray);
  console.log('Can forEach:', typeof safeArray.forEach === 'function');
  safeArray.forEach(item => console.log('  Item:', item));
}

console.log('=== TESTING TYPEERROR FIX ===\n');
console.log('1. OLD WAY (causes error):');
oldLoadJobTitles();

console.log('\n2. NEW WAY (fixed):');
newLoadJobTitles();

console.log('\n3. DEFENSIVE CODING TESTS:');
testDefensiveCoding([1, 2, 3], 'valid array');
testDefensiveCoding({ jobTitles: [] }, 'object (not array)');
testDefensiveCoding(null, 'null value');
testDefensiveCoding(undefined, 'undefined value');

console.log('\n=== ALL TESTS COMPLETE ===');
