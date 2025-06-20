var express = require('express');
var router = express.Router();
/* GET users listing. */
// const express=require('express');
// const app=express()
var conn=require('../database');

router.get('/form', function(req, res, next) {
  // res.render('voter-registration.ejs');
  if(req.session.loggedinUser){
    res.render('voter-registration.ejs')
  }else{
    res.redirect('/login');
  }
});


var getAge = require('get-age');


var nodemailer = require('nodemailer');
var rand=Math.floor((Math.random() * 10000) + 54);

// Email Configuration
// Replace these with your email and app password
const EMAIL_USER = 'blockchainvoting2@gmail.com';  // Put your gmail address here
const EMAIL_APP_PASSWORD = 'xhmt ocvm nrmw rgjo';  // Put the 16-character app password here

var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Test email configuration on startup
transporter.verify(function(error, success) {
    if (error) {
        console.log('Email setup error:', error);
    } else {
        console.log('Email server is ready');
    }
});

var account_address;
var data;

// app.use(express.static('public'));
// //app.use('/css',express.static(__dirname+'public/css'));
// //app.use(express.json());
// app.use(express.urlencoded());

router.post('/registerdata', function(req, res) {
    data = req.body.IDno;
    console.log("IDno:", data);
    account_address = req.body.account_address;

    // Validate input
    if (!data || data.length !== 13 || !/^\d+$/.test(data)) {
        return res.render('voter-registration.ejs', {
            alertMsg: "Invalid ID number format. Please enter a 13-digit number"
        });
    }

    // Use parameterized query with array syntax
    let sql = "SELECT * FROM id_info WHERE idno = ?";
    console.log("Executing query:", sql, "with data:", data);
    
    conn.query(sql, [data], function(error, results) {
        console.log("Query callback entered");
        
        if (error) {
            console.error("Database error:", error);
            return res.render('voter-registration.ejs', {
                alertMsg: "Database error occurred"
            });
        }

        console.log("Full results from database:", results);

        if (!results || results.length === 0) {
            return res.render('voter-registration.ejs', {
                alertMsg: "ID not found in system"
            });
        }

        const userData = results[0];
        console.log("User data:", userData);
        
        // Get DOB from database (it's already a Date object)
        const birthDate = new Date(userData.dob);
        console.log("Birth date:", birthDate);

        // Calculate age
        const today = new Date();
        console.log("Today:", today);

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        console.log("Calculated age:", age);

        // Check registration status
        if (userData.is_registered === 'Yes') {
            console.log("User already registered");
            return res.render('voter-registration.ejs', {
                alertMsg: "You are already registered. Cannot register again"
            });
        }

        // Check age
        if (age < 18) {
            console.log("User age less than 18");
            return res.render('voter-registration.ejs', {
                alertMsg: "You cannot vote as your age is less than 18"
            });
        }

        // If we get here, user is eligible to register
        console.log("User eligible for registration, proceeding with email verification");
        
        // Setup email data
        var mailOptions = {
            from: 'election.blockchain@gmail.com',
            to: userData.email,
            subject: 'Email Verification - E-voting System',
            html: `<p>Your OTP for E-voting System Registration is <b>${rand}</b></p>`
        };

        // Send email
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.error("Email error:", error);
                return res.render('voter-registration.ejs', {
                    alertMsg: "Failed to send verification email"
                });
            }
            console.log("Email sent:", info.response);
            res.render('emailverify.ejs');
        });
    });
});

    //console.log(dob);
    //console.log(age);
    //res.send("ok")
    //console.log(dob);

router.post('/otpverify', (req, res) => {
    var otp = req.body.otp;
    if (otp == rand) {
        var record = { 
            account_address: account_address,
            is_registered: 'Yes'
        };
        
        var sql = "INSERT INTO registered_users SET ?";
        console.log("Executing query:", sql, "With values:", record);
        
        conn.query(sql, record, function(err2, res2) {
            if (err2) {
                console.error("Insert error:", err2);
                return res.render('voter-registration.ejs', {
                    alertMsg: "Registration failed"
                });
            }
            
            // Update id_info table
            var sql1 = "UPDATE id_info SET is_registered = ? WHERE idno = ?";
            console.log("Executing update query:", sql1, "With values:", ['Yes', data]);
            
            conn.query(sql1, ['Yes', data], function(err1, res1) {
                if (err1) {
                    console.error("Update error:", err1);
                    return res.render('voter-registration.ejs', {
                        alertMsg: "Update failed"
                    });
                }
                
                console.log("Record updated successfully");
                res.render('voter-registration.ejs', {
                    alertMsg: "You are successfully registered"
                });
            });
        });
    } else {
        res.render('voter-registration.ejs', {
            alertMsg: "Session Expired! You entered wrong OTP"
        });
    }
});



// router.get('/register',function(req,res){
//     res.sendFile(__dirname+'/views/index.html')
// });

/*app.get('/signin_signup',function(req,res){
    res.sendFile(__dirname+'/views/signup.html')
});

app.get('/signup',function(req,res){
    console.log(req.body);
    res.sendFile(__dirname+'/views/signup.html')
});*/

// Add candidate route
router.post('/addCandidate', function(req, res) {
    const { name, age, party, qualification } = req.body;
    
    // Validate input
    if (!name || !age || !party || !qualification) {
        return res.status(400).json({ 
            success: false, 
            message: "All fields are required" 
        });
    }

    const candidate = {
        name: name,
        age: parseInt(age),
        party: party,
        qualification: qualification,
        votes: 0
    };

    const sql = "INSERT INTO candidates SET ?";
    console.log("Adding candidate:", candidate);

    conn.query(sql, candidate, function(err, result) {
        if (err) {
            console.error("Error adding candidate:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to add candidate"
            });
        }
        
        console.log("Candidate added successfully");
        res.status(200).json({
            success: true,
            message: "Candidate added successfully"
        });
    });
});

// Get candidates route
router.get('/getCandidates', function(req, res) {
    const sql = "SELECT * FROM candidates";
    
    conn.query(sql, function(err, results) {
        if (err) {
            console.error("Error fetching candidates:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch candidates"
            });
        }
        
        res.status(200).json({
            success: true,
            candidates: results
        });
    });
});

module.exports = router;