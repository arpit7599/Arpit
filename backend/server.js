const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'YOUR_DB_PASSWORD',
    database: 'empowher'
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL connected ✅');
});

// API endpoint to save user
app.post('/register', async (req, res) => {
    const {
        fname, lname, email, phone, gender, city, password,
        ec1_name, ec1_relation, ec1_phone, ec1_email,
        ec2_name, ec2_relation, ec2_phone, ec2_email,
        ec3_name, ec3_relation, ec3_phone, ec3_email
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO users
    (fname,lname,email,phone,gender,city,password,
    ec1_name,ec1_relation,ec1_phone,ec1_email,
    ec2_name,ec2_relation,ec2_phone,ec2_email,
    ec3_name,ec3_relation,ec3_phone,ec3_email)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const values = [
        fname,lname,email,phone,gender,city,hashedPassword,
        ec1_name,ec1_relation,ec1_phone,ec1_email,
        ec2_name,ec2_relation,ec2_phone,ec2_email,
        ec3_name,ec3_relation,ec3_phone,ec3_email
    ];

    db.query(sql, values, (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).send({message: 'Database error'});
        }
        res.send({message: 'Account created successfully!'});
    });
});

// Start server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
