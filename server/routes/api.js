const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const con = require('../connection.js');


const router = express.Router();

//get all task details
router.get('/tasks', (req, res) => {
  con.query('select * from task', (err, result) => {
    if (err) {
      res.send('Error')
    } else {
      res.send(result)
    }
  })
})


//Insert data into task table
router.post('/tasks', (req, res) => {

  var title = req.body.title;
  var des = req.body.desc;
  var duedate = req.body.date;
  var priority = req.body.priority;
  var status = req.body.status;
  try {
    con.query(
      "INSERT INTO task (title, description, dueDate, priority, status) VALUES (?, ?, ?, ?, ?)",
      [title, des, duedate, priority, status],
      function (err, result) {
        if (err) {
          console.error(err);
          res.status(500).json({ message: "Error inserting data" });
        } else {

          res.status(200).json({ message: "Data inserted successfully", result });
        }
      }
    );
  } catch (err) {
    console.error(err); // Log any unexpected errors
    res.status(500).json({ message: "An unexpected error occurred" });
  }
})

// DELETE API endpoint
router.delete('/tasks/:id', (req, res) => {
  const taskId = req.params.id;

  const query = 'DELETE FROM task WHERE taskid = ?';

  con.query(query, [taskId], (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send({ error: 'Database query error' });
    } else if (result.affectedRows === 0) {
      res.status(404).send({ message: `User with ID ${taskId} not found.` });
    } else {
      res.status(200).send({ message: `User with ID ${taskId} deleted successfully.` });
    }
  });
});


//Get task by taskid
router.get('/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const query = 'SELECT taskid, title, description, priority, status, DATE(dueDate) AS dueDate FROM task WHERE taskid = ?';

  con.query(query, [taskId], (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send({ error: 'Database query error' });
    } else if (result.length === 0) {
      res.status(404).send({ message: `Task with ID ${taskId} not found.` });
    } else {
      res.status(200).send(result[0]);
    }
  });
});

//update task using taskid
router.put('/tasks/:id', (req, res) => {
  const taskId = req.params.id; // Get task ID from the URL
  const { title, description,  priority, status } = req.body; 
  
  const query = 'UPDATE task SET title = ?,description = ?,   priority = ?, status = ? WHERE taskid = ?';

  con.query(query, [title, description,  priority, status, taskId], (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send({ error: 'Database query error' });
    } else if (result.affectedRows === 0) {
      res.status(404).send({ message: `Task with ID ${taskId} not found.` });
    } else {
      res.status(200).send({ message: `Task with ID ${taskId} updated successfully.` });
    }
  });
});

//Register new user 
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if email already exists
    const checkEmailQuery = "SELECT * FROM login WHERE email = ?";
    con.query(checkEmailQuery, [email], async (err, results) => {
      
      if (err) {
        console.error('Error checking email:', err);
        return res.status(500).json({ error: 'Database query error' });
      }
      if (results.length > 0) {
        console.log("result found ")
        return res.send({ error: 'Email is already registered' });
      }
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // SQL query to insert the user
      const insertUserQuery = "INSERT INTO login (username, email, password, userRole) VALUES (?, ?, ?, ?)";
      const userValues = [username, email, hashedPassword, role];

      // Insert the user into the database
      con.query(insertUserQuery, userValues, (err, result) => {
        if (err) {
          console.error('Error inserting data:', err);
          return res.status(500).json({ error: 'Error inserting user into database' });
        }
        return res.send({ status: 'Success' });
      });
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//api for login from login table
router.post('/login', async (req, res) => {
  try {
      const { email, password } = req.body;
      // Check for missing fields
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      // Find the user by email
      const sql = "SELECT * FROM login WHERE email = ?";
      con.query(sql, [email], async (err, results) => {
          if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: 'Internal server error' });
          }


          const user = results[0];        
          // Compare the provided password with the hashed password
          const passwordMatch = await bcrypt.compare(password, user.password);
         
          if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
          }
          // Generate JWT Token
          const token = jwt.sign(
              { name: user.name }, 'jwt-secret-key', { expiresIn: '1h' } // Token expires in 1 hour
          );

            res.cookie('token',token )
          res.status(200).json({ message: 'Login successful', token, role: user.userRole});
      });

  } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route
router.get('/logout',  (req, res) => {
  res.clearCookie('token');
  return res.json({ Status: "Success"});
});

module.exports = router;