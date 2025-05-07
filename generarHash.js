const bcrypt = require('bcryptjs');
const password = '12345678';
const saltRounds = 10; // Asegúrate que coincida con SALT_ROUNDS en tu src/lib/authUtils.ts (actualmente es 10)

bcrypt.hash(password, saltRounds, function (err, hash) {
  if (err) {
    console.error('Error al generar el hash:', err);
  } else {
    console.log('El hash para la contraseña "' + password + '" es:');
    console.log(hash);
  }
});
