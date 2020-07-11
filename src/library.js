const generate = require('./actions');
const {booksQuery} = require('./actions');
class Library {
  async addBook(client, book) {
    const { isbn, title, category, author } = book;
    const insertBook = generate.insertQuery('books', [
      isbn,
      title,
      category,
      author,
    ]);
    const insertCopy = generate.insertQueryForCopy([isbn, true]);
    const transaction = generate.createTransaction([insertBook, insertCopy]);
    return client.executeTransaction(transaction, {
     message: 'Book registered successfully.',
      isbn,
      title,
      category,
      author,
    });
  }

  async isIsbnAvailable(client, isbn) {
    const bookQuery = generate.searchQuery(`isbn`, isbn);
    return await client.getAll(bookQuery, {message: `${isbn} not available.` });
  }

  async addCopy(client, isbn) {
    if (await this.isIsbnAvailable(client, isbn)) {
      const insertCopy = generate.insertQueryForCopy([isbn, true]);
      const transaction = generate.createTransaction([insertCopy]);
      return client.executeTransaction(transaction, {
       message: 'Copy registered successfully.',
        isbn,
      });
    }
  }

  async borrowBook(client, bookInfo, memberId) {
    const { key, isbn, title } = bookInfo;
    const availableBooks = generate.searchQuery(key, isbn, title);
    const book = await client.get(availableBooks, {message: 'Book unavailable.' });
    const availableCopies = generate.availableCopiesQuery(book.isbn);
    const bookCopy = await client.get(availableCopies, {
     message: 'Currently unavailable.',
    });
    const updateCopyAvailability = generate.updateBookQuery(
      bookCopy.serialNo,
      false
    );
    const currentDate = new Date();
    const updateBorrowActivity = generate.borrowActivityQuery([
      memberId,
      bookCopy.serialNo,
      currentDate.toDateString(),
      new Date(currentDate.valueOf() + 864000000).toDateString(),
    ]);
    const transaction = generate.createTransaction([
      updateCopyAvailability,
      updateBorrowActivity,
    ]);
    return client.executeTransaction(transaction, {
     message: 'borrowed successfully.',
      title: book.title,
      memberId,
      serialNo: bookCopy.serialNo,
    });
  }

  async returnBook(client, serialNo, userId) {
    const borrowBooks = generate.borrowedCopyQuery(serialNo);
    const book = await client.get(borrowBooks, {
     message: 'Book was not taken from library.',
    });
    const updateCopyAvailability = generate.updateBookQuery(
      book.serialNo,
      true
    );
    const transactionDetails = await client.get( generate.transactionQuery(serialNo,userId),{message:"You haven't borrowed this book"} );
    const updateReturnActivity = generate.insertQuery('returnActivity', [
      transactionDetails.transactionId,
      new Date().toDateString(),
    ]);
    const transaction = generate.createTransaction([
      updateCopyAvailability,
      updateReturnActivity,
    ]);
    return client.executeTransaction(transaction, {
     message: 'returned successfully.',
      userId,
      serialNo: book.serialNo,
    });
  }

  async show(client, table) {
    let bookQuery = `select * from ${table};`;
    if (table === 'activity log') bookQuery = `${generate.activityLogQuery()};`;
    if (table === 'all books') bookQuery = `${generate.booksQuery()};`;
    const errMsg = {message: 'Table is empty.' };
    return await client.getAll(bookQuery, errMsg);
  }

  async showHistory(client, userId) {
    const activityQuery = `${generate.userActivityLogQuery(userId)};`;
    const errMsg = {message: 'Table is empty.' };
    return await client.getAll(activityQuery, errMsg);
  }

  async search(client, info) {
    let booksQuery = generate.availableBooksQuery();
    if (info.key !== 'available')
      booksQuery = generate.searchQuery(info.key, info[info.key]);
    const errMsg = {message: `${info.key} ${info[info.key]} not matched.` };
    return await client.getAll(booksQuery, errMsg);
  }

  async registerUser(client, { id, name, password }, designation='borrower') {
    const addMember = generate.insertQuery('members', [
      id,
      name,
      password,
      designation,
    ]);
    return await client.runQuery(addMember, {
     message: 'Registered successfully.',
    });
  }

  async validatePassword(client, id, password) {
    const member = await client.get(generate.memberQuery(id, password), {
     message: 'Details not matched.',
    });
    return { id: member.id, domain: member.designation };
  }
}

module.exports = { Library };
