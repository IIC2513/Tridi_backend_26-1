# Tridi - Backend_26-1
- **Nombre del grupo:** `gitaddpuntoenvguionguionforceampersandampersandgitpushguionguionforce`
- **Integrantes:** `Ignacio Gutiérrez Fuenzalida`, `Francisco Cornejo Quiroga` y `Gonzalo Rivas Valenzuela`

## Instalación y Configuración
Es importante destacar que lo primero que se debe hacer, será instalar las dependencias con el siguiente comando:
```
npm install
```

Luego, el siguiente paso será crear la base de datos y configurar todo como corresponde. Para ello, ver primero las secciones **Postgres**, **Variables de Entorno** y **Sequelize** que están más adelante en este documento.

Si ya se tiene todo configurado y con la base de datos creada y poblada, basta con ejecutar el siguiente comando para levantar la API y probarla como se estime conveniente en el puerto declarado:

```
npm run dev
```

### Postgres
Con *PostgreSQL* correctamente instalado y configurado (En caso de que no, ingrese a este [Tutorial Adjunto](https://www.w3schools.com/postgresql/postgresql_install.php)), inicializaremos nuestra base de datos con la siguiente serie de comandos en la terminal:
```sql
sudo service postgresql start
sudo -i -u postgres 
# Si se solicita, ingresamos contraseña creada en la instalación

# Ya en postgres@...:
createdb DB_NAME 
# Donde 'DB_NAME' es el nombre que se le quiera dar a la BDD
createuser DB_USER
# Donde 'DB_USER' es el nombre que se le quiera dar a nuestro usuario privilegiado

# Ingresamos a la consola psql:
psql

# Ya en postgres=#:
ALTER USER DB_USER WITH PASSWORD 'DB_PASSWORD'; 
# Donde 'DB_PASSWORD' (Usando igual comillas simples ' ') es la contraseña que se le quiera asignar al usuario privilegiado
GRANT ALL PRIVILEGES ON DATABASE DB_NAME TO DB_USER;
ALTER USER DB_USER createdb;

# Y, aún en postgres=#, para prevenir problemas de acceso a schema public:
\c DB_NAME
GRANT ALL ON SCHEMA public TO DB_USER;

# Finalmento, salimos del entorno:
exit # Salimos de DB_NAME=# / postgres=#
exit # Salimos de postgres@...
```

Con eso, ya tendriamos los preparativos para, a continuación, ocupar nuestra base de datos.

### Variables de Entorno
Una vez creada la base de datos e inicializado psql, se debe crear un archivo `.env`. Se tendrá el archivo `.env.example` como estructura base, donde, para el `.env`, se deberán hacer las modificaciones de los valores correspondientes definidos en el paso anterior:

```js
DB_HOST= // Al ser trabajo local, puede ser localhost o 127.0.0.1
DB_NAME= // Nombre de la BDD creado anteriormente
DB_USER= // Nombre del usuario privilegiado creado anteriormente
DB_PASSWORD= // Contraseña que se le asignó al usuario privilegiado

JWT_SECRET= // Código secreto que queramos.
```
El resto de valores los podemos dejar tal como vienen en `.env.example`. Lo importante es finalmente tener el archivo `.env` con todas esas declaraciones de la estructura base, más las modificaciones que se requieran para los datos correctos.

### Sequelize

Luego de creada la base de datos y de definir el archivo `.env`, tocará hacer uso de las migraciones (Ya configuradas en la carpeta `/migrations`) y poblar inicialmente la base de datos para probar que todo funcione bien. Para esto último, ya vendrán incluidas las *seeds* por cada entidad en la carpeta `/seeders`. 

De esa forma, se deberán ejecutar los siguientes comandos:
```js
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

Y con eso estaría todo listo para levantar la API tal como se mencionaba en la sección **Ejecución**.

### Documentación API
La documentación de la API se encuentra en la ruta `/api-docs`

## Consideraciones
- La ejecución se desarrolló en un ambiente de Linux, a través de *Ubuntu WSL*.
- Deploy de la API: *https://webback.gentlehill-9254b544.eastus.azurecontainerapps.io/*