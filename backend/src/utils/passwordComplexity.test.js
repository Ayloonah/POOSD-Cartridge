const { passwordComplexity } = require('./passwordComplexity');

if (require.main === module) {
    (async () => {
        console.log("--- Running Password Complexity Tests ---");

        // Test 1: Perfectly valid password
        const test1 = await passwordComplexity("P@ss1234");
        console.log(`Test 1 (Valid): Expected true -> Got: ${test1}`);

        // Test 2: Too short
        const test2 = await passwordComplexity("P@s1");
        console.log(`Test 2 (Too Short): Expected false -> Got: ${test2}`);

        // Test 3: Missing special character
        const test3 = await passwordComplexity("Password123");
        console.log(`Test 3 (No Symbol): Expected false -> Got: ${test3}`);

        // Test 4: Too long (over the default 14 max)
        const test4 = await passwordComplexity("P@ssword123456789");
        console.log(`Test 4 (Too Long): Expected false -> Got: ${test4}`);
    })();
}