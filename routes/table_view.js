var express = require('express');
var router = express.Router();
var db=require('../database');

// another routes also appear here
// this script to fetch data from MySQL databse table
router.get('/table_view', function(req, res, next) {
    var sql='SELECT * FROM registered_users';
    db.query(sql, (err, data, fields) =>{
    if (err) 
    {
        console.log(err)
        throw err;
    }
    
    // Map the data to match the template's expected format
    const userData = data.map(row => ({
        Account_address: row.account_address,
        Is_registered: row.is_registered,
        Blockchain_registered: 'No'  // Default to No, will be updated by frontend
    }));
    
    res.render('adminVoterReg', { title: 'Registered Users List', userData: userData});
  });
});

module.exports = router;