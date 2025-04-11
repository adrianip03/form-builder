require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Function to execute schema
const executeSchema = () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split the schema into individual statements
  const statements = schema.split(';').filter(statement => statement.trim() !== '');
  
  // Execute each statement
  statements.forEach(statement => {
    db.query(statement, (err) => {
      if (err) {
        console.error('Error executing schema statement:', err);
        return;
      }
    });
  });
};

// Connect to database and execute schema
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  executeSchema();
  console.log('Database schema initialized');
});

// Test endpoint
app.get('/api/test', (req, res) => {
  db.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Database connection successful', result: results[0].solution });
  });
});

// Helper function to save a question and its choices
const saveQuestion = (formId, question, callback) => {
  const { questionType, questionText, choices, columns, branching } = question;
  
  // Insert the question
  db.query(
    'INSERT INTO Questions (form_id, question_type, question_text) VALUES (?, ?, ?)',
    [formId, questionType, questionText],
    (err, result) => {
      if (err) return callback(err);
      
      const questionId = result.insertId;
      
      if (questionType === 'mcq' && choices) {
        // Save MCQ choices
        const values = choices.map(choice => [questionId, choice.text]);
        db.query(
          'INSERT INTO MCQChoices (question_id, choice_text) VALUES ?',
          [values],
          (err, result) => {
            if (err) return callback(err);
            
            // If there's branching logic, save it
            if (branching) {
              const choiceIds = result.insertId - choices.length + 1; // Get the first inserted choice ID
              const branchingValues = choices.map((choice, index) => {
                if (choice.nextQuestionId) {
                  return [questionId, choiceIds + index, choice.nextQuestionId];
                }
                return null;
              }).filter(Boolean);
              
              if (branchingValues.length > 0) {
                db.query(
                  'INSERT INTO BranchingLogic (question_id, choice_id, target_question_id) VALUES ?',
                  [branchingValues],
                  (err) => callback(err)
                );
              } else {
                callback(null);
              }
            } else {
              callback(null);
            }
          }
        );
      } else if (questionType === 'table' && columns) {
        // Save table columns and their choices
        let remainingColumns = columns.length;
        
        columns.forEach(column => {
          db.query(
            'INSERT INTO TableColumns (question_id, column_name, column_type) VALUES (?, ?, ?)',
            [questionId, column.name, column.type],
            (err, result) => {
              if (err) return callback(err);
              
              const columnId = result.insertId;
              
              if (column.type === 'mcq' && column.choices) {
                const values = column.choices.map(choice => [columnId, choice]);
                db.query(
                  'INSERT INTO TableColumnChoices (column_id, choice_text) VALUES ?',
                  [values],
                  (err) => {
                    if (err) return callback(err);
                    if (--remainingColumns === 0) callback(null);
                  }
                );
              } else {
                if (--remainingColumns === 0) callback(null);
              }
            }
          );
        });
      } else {
        callback(null);
      }
    }
  );
};

// Save form endpoint
app.post('/api/forms', (req, res) => {
  const { formName, questions } = req.body;
  
  if (!formName || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Invalid form data' });
  }
  
  // Start a transaction
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to start transaction' });
    }
    
    // Insert the form
    db.query(
      'INSERT INTO Forms (form_name) VALUES (?)',
      [formName],
      (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: 'Failed to save form' });
          });
        }
        
        const formId = result.insertId;
        let remainingQuestions = questions.length;
        
        // Save each question
        questions.forEach(question => {
          saveQuestion(formId, question, (err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: 'Failed to save questions' });
              });
            }
            
            if (--remainingQuestions === 0) {
              // All questions saved successfully
              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ error: 'Failed to commit transaction' });
                  });
                }
                res.status(201).json({ message: 'Form saved successfully', formId });
              });
            }
          });
        });
      }
    );
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 