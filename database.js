// database.js
const mysql = require('mysql');

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Block@ch@in123',
    database: 'e_voting',
    multipleStatements: false
});

conn.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        process.exit(1);
    }
    console.log('Database connected successfully!');
});

// Add query debugging
const originalQuery = conn.query;
conn.query = function(sql, values, callback) {
    console.log('Executing query:', sql);
    if (values) console.log('With values:', values);
    return originalQuery.call(this, sql, values, callback);
};

module.exports = conn;