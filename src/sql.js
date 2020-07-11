const schemas = require("./schema");

class Sql {
  constructor(db) {
    this.db = db;
  }

  createTable(schema) {
    return new Promise((resolve, reject) => {
      this.db.run(schema, (err) => {
        if (err) reject(err);
        resolve({message: 'Table created successfully.' });
      });
    });
  }

  static async init(db) {
    const sql = new Sql(db);

    await sql.createTable(schemas.books);
    await sql.createTable(schemas.copies);
    await sql.createTable(schemas.borrowActivity);
    await sql.createTable(schemas.returnActivity);
    await sql.createTable(schemas.members);

    return sql;
  }

  executeTransaction(transaction,message) {
    return new Promise((resolve, reject) => {
      this.db.exec(transaction, (err) => {
        if (err) reject(err);
        resolve(message);
      });
    });
  }

  runQuery(query,message) {
    return new Promise((resolve, reject) => {
      this.db.run(query, (err) => {
        if (err) reject(err);
        resolve(message);
      });
    });
  }

  getAll(query, errMsg) {
    return new Promise((resolve, reject) => {
      this.db.all(query, (err, row) => {
        if (err) reject(err);
        if (!row.length) reject(errMsg);
        resolve(row);
      });
    });
  }

  get(query, errMsg) {
    return new Promise((resolve, reject) => {
      this.db.get(query, (err, row) => {
        if (err) reject(err);
        if (!row) reject(errMsg);
        resolve(row);
      });
    });
  }
}

module.exports = { Sql };
