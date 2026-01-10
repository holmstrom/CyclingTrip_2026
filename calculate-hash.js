// Calculate hash for 'Baddi'
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

const password = 'Baddi';
const hashed = hashPassword(password);
console.log('Password: ' + password);
console.log('Hashed value: ' + hashed);
console.log('\nCopy this value to Firebase: ' + hashed);

