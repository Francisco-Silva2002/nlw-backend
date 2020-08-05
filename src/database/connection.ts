import knex from "knex"; //query builder
import path from "path"; //biblioteca para lidar com caminhos da aplicação

// cria conexão com banco de dados sqlite

const db = knex({
  client: "sqlite3",
  connection: {
    filename: path.resolve(__dirname, "database.sqlite"),
  },
  useNullAsDefault: true,
});

/*
  Por que estou usando sqlite?
    Porque é um banco de dados pequeno, podendo ficar armazenado na própria aplicação, sem a
    necessidade de instalar muitos programas 
*/

export default db;
