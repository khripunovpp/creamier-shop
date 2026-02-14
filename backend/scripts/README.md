# Admin User Creation

To create an admin user, you need to generate a bcrypt hash of the password you want to use. You can do this using the `generate-admin-pass.js` script included in this directory.
```
node generate-admin-pass.js YourPasswordHere
```

This will output a bcrypt hash that you can use in the SQL insert statement below. Replace `bcrypt_hash_here` with the generated hash and
```
insert into admin_users (email, password_hash)
values ('your@email.com', 'bcrypt_hash_here');
```