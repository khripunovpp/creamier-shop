import bcrypt from 'bcryptjs';

const secretArg = process.argv[2];

if (!secretArg) {
    console.error('Please provide a secret as an argument');
    process.exit(1);
}

bcrypt.hash(secretArg, 12)
    .then((hash) => {
        console.log(`Hashed JWT secret: ${hash}`);
    })
    .catch((err) => {
        console.error('Error hashing JWT secret:', err);
        process.exit(1);
    });