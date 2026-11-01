import { MongoClient, ServerApiVersion, type Db } from "mongodb";

/**
 * Cliente de MongoDB perezoso.
 *
 * No crea el `MongoClient` al importar el módulo: así los tests que solo
 * importan helpers puros no intentan conectarse ni leen `DATABASE` antes de
 * tiempo. La conexión real se inicializa en la primera operación.
 */

let client: MongoClient | undefined;
let database: Db | undefined;

function getClient(): MongoClient {
  if (!client) {
    const uri = process.env.DATABASE;
    if (!uri) {
      throw new Error("DATABASE no configurado");
    }
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
  }
  return client;
}

function getDatabase(): Db {
  if (!database) {
    database = getClient().db("anime");
  }
  return database;
}

const dbClient = new Proxy({} as Db, {
  get(_target, property) {
    const db = getDatabase();
    const value = Reflect.get(db, property);
    return typeof value === "function" ? value.bind(db) : value;
  },
});

export default dbClient;
