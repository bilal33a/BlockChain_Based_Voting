var express = require('express');
var router = express.Router();
var db=require('../database');
var app = express();
app.use(express.urlencoded());
app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use('/css',express.static(__dirname + 'public/css'))

// to display registration form 
router.get('/register', function(req, res, next) {
  res.render('registration-form.ejs');
});


// to store user input detail on post request
router.post('/register', function(req, res, next) {
    const inputData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email_address: req.body.email_address,
        gender: req.body.gender,
        password: req.body.password,
        confirm_password: req.body.confirm_password
    };

    // Validate input
    if (inputData.password !== inputData.confirm_password) {
        return res.render('registration-form.ejs', {
            alertMsg: "Password & Confirm Password do not match"
        });
    }

    // Check email uniqueness
    const checkEmailSql = 'SELECT * FROM registration WHERE email_address = ?';
    db.query(checkEmailSql, [inputData.email_address], function(err, data) {
        if (err) {
            console.error("Email check error:", err);
            return res.render('registration-form.ejs', {
                alertMsg: "Database error occurred"
            });
        }
        
        if (data.length > 0) {
            return res.render('registration-form.ejs', {
                alertMsg: `${inputData.email_address} is already registered`
            });
        }
        
        // Insert new user
        const insertSql = 'INSERT INTO registration SET ?';
        db.query(insertSql, inputData, function(err, result) {
            if (err) {
                console.error("Registration error:", err);
                return res.render('registration-form.ejs', {
                    alertMsg: "Registration failed. Please try again."
                });
            }
            
            res.render('registration-form.ejs', {
                alertMsg: "Registration successful! You can now login."
            });
        });
    });
});
module.exports = router;
