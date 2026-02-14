import bcrypt from 'bcryptjs';

const passwordArg = process.argv[2];

if (!passwordArg) {
    console.error('Please provide a password as an argument');
    process.exit(1);
}

bcrypt.hash(passwordArg, 12)
    .then((hash) => {
        console.log(`Hashed password: ${hash}`);
    })
    .catch((err) => {
        console.error('Error hashing password:', err);
        process.exit(1);
    });