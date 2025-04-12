require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { AppError, ValidationError, DatabaseError } = require('./errors');

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
        throw new DatabaseError('Failed to initialize database schema', err);
      }
    });
  });
};

// Connect to database and execute schema
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    throw new DatabaseError('Failed to connect to database', err);
  }
  console.log('Connected to MySQL database');
  executeSchema();
  console.log('Database schema initialized');
});

// Test endpoint
app.get('/api/test', (req, res, next) => {
  db.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
      next(err);
      return;
    }
    res.json({ message: 'Database connection successful', result: results[0].solution });
  });
});

// Preview all tables endpoint
app.get('/api/preview-tables', (req, res, next) => {
  // Query to get all table names
  db.query(
    `SELECT TABLE_NAME as tableName 
     FROM information_schema.tables 
     WHERE table_schema = ?`,
    [process.env.DB_NAME],
    (err, tables) => {
      if (err) {
        console.error('Error fetching tables:', err);
        next(new DatabaseError('Failed to fetch tables', err));
        return;
      }

      // For each table, get its structure and sample data
      Promise.all(tables.map(table => {
        return new Promise((resolve, reject) => {
          const tableName = table.tableName;
          
          // Get table structure
          db.query(
            `SELECT column_name, data_type, is_nullable, column_key 
             FROM information_schema.columns 
             WHERE table_schema = ? AND table_name = ?`,
            [process.env.DB_NAME, tableName],
            (err, structure) => {
              if (err) {
                reject(new DatabaseError(`Failed to fetch structure for table ${tableName}`, err));
                return;
              }

              // Get sample data (limit to 5 rows)
              db.query(
                `SELECT * FROM \`${tableName}\` LIMIT 5`,
                (err, data) => {
                  if (err) {
                    reject(new DatabaseError(`Failed to fetch data for table ${tableName}`, err));
                    return;
                  }

                  resolve({
                    tableName,
                    structure,
                    sampleData: data
                  });
                }
              );
            }
          );
        });
      }))
      .then(results => {
        res.json({
          status: 'success',
          data: results
        });
      })
      .catch(err => {
        next(err);
      });
    }
  );
});

// Helper function to validate form data
const validateFormData = (formName, questions) => {
  const errors = [];
  
  // Validate form name
  if (!formName || typeof formName !== 'string' || formName.trim().length === 0) {
    errors.push('Form name is required and must be a non-empty string');
  } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formName)) {
    errors.push('Form name contains invalid characters');
  }
  
  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push('Questions array is required and must not be empty');
  } else {
    questions.forEach((question, index) => {
      // Validate question type
      const validTypes = ['text', 'mcq', 'table', 'section'];
      if (!question.questionType || !validTypes.includes(question.questionType)) {
        errors.push(`Question ${index + 1}: Invalid question type`);
      }
      
      // Validate question text
      if (!question.questionText || typeof question.questionText !== 'string' || question.questionText.trim().length === 0) {
        errors.push(`Question ${index + 1}: questionText is required`);
      } else if (question.questionText.length > 1000) {
        errors.push(`Question ${index + 1}: questionText must be less than 1000 characters`);
      }
      
      // Validate MCQ choices
      if (question.questionType === 'mcq') {
        if (!question.choices || !Array.isArray(question.choices) || question.choices.length === 0) {
          errors.push(`Question ${index + 1}: choices array is required for MCQ questions`);
        } else {
          question.choices.forEach((choice, choiceIndex) => {
            if (!choice.text || typeof choice.text !== 'string' || choice.text.trim().length === 0) {
              errors.push(`Question ${index + 1}, Choice ${choiceIndex + 1}: text is required`);
            }
            if (choice.nextQuestionId && typeof choice.nextQuestionId !== 'string') {
              errors.push(`Question ${index + 1}, Choice ${choiceIndex + 1}: nextQuestionId must be a string`);
            }
          });
        }
      }
      
      // Validate table columns
      if (question.questionType === 'table') {
        if (!question.columns || !Array.isArray(question.columns) || question.columns.length === 0) {
          errors.push(`Question ${index + 1}: columns array is required for table questions`);
        } else {
          question.columns.forEach((column, columnIndex) => {
            if (!column.header || typeof column.header !== 'string' || column.header.trim().length === 0 ) {
              errors.push(`Question ${index + 1}, Column ${columnIndex + 1}: header is required`);
            }
            if (!column.type || !['text', 'mcq'].includes(column.type)) {
              errors.push(`Question ${index + 1}, Column ${columnIndex + 1}: invalid column type`);
            }
            if (column.type === 'mcq' && (!column.choices || !Array.isArray(column.choices) || column.choices.length === 0)) {
              errors.push(`Question ${index + 1}, Column ${columnIndex + 1}: choices array is required for mcq columns`);
            }
          });
        }
      }
    });
  }
  
  return errors;
};

// Save form endpoint
app.post('/api/forms', async (req, res, next) => {
  try {
    const { formName, questions } = req.body;
    
    // Validate form data
    const validationErrors = validateFormData(formName, questions);
    if (validationErrors.length > 0) {
      throw new ValidationError('Invalid form data', { errors: validationErrors });
    }
    
    // Start a transaction
    await new Promise((resolve, reject) => {
      db.beginTransaction((err) => {
        if (err) {
          console.error('Error starting transaction:', err);
          reject(new DatabaseError('Failed to start transaction', err));
          return;
        }
        resolve();
      });
    });
    
    // Insert the form
    const formResult = await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO Forms (form_name) VALUES (?)',
        [formName],
        (err, result) => {
          if (err) {
            console.error('Error saving form:', err);
            reject(new DatabaseError('Failed to save form', err));
            return;
          }
          resolve(result);
        }
      );
    });
    
    const formId = formResult.insertId;
    
    // Save all questions in parallel and collect their IDs
    const questionResults = await Promise.all(questions.map(question => 
      new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO Questions (form_id, question_type, question_text) VALUES (?, ?, ?)',
          [formId, question.questionType, question.questionText],
          (err, result) => {
            if (err) {
              reject(new DatabaseError('Failed to save question', err));
              return;
            }
            resolve({ clientId: question.id, dbId: result.insertId });
          }
        );
      })
    ));
    
    // Create a map of client IDs to database IDs
    const questionIdMap = new Map(questionResults.map(r => [r.clientId, r.dbId]));
    
    console.log(questionIdMap);

    // Save MCQ choices and table columns in parallel
    await Promise.all(questions.map(question => {
      const dbQuestionId = questionIdMap.get(question.id);
      
      if (question.questionType === 'mcq' && question.choices) {
        const values = question.choices.map(choice => { 
          console.log(choice.nextQuestionId, questionIdMap.get(choice.nextQuestionId));
          return[
          dbQuestionId,
          choice.text,
          choice.nextQuestionId ? questionIdMap.get(choice.nextQuestionId) : null
        ]});

        
        return new Promise((resolve, reject) => {
          db.query(
            'INSERT INTO MCQChoices (question_id, choice_text, next_question_id) VALUES ?',
            [values],
            (err) => {
              if (err) {
                reject(new DatabaseError('Failed to save MCQ choices', err));
                return;
              }
              resolve();
            }
          );
        });
      } else if (question.questionType === 'table' && question.columns) {
        return Promise.all(question.columns.map(column => {
          return new Promise((resolve, reject) => {
            db.query(
              'INSERT INTO TableColumns (question_id, column_name, column_type) VALUES (?, ?, ?)',
              [dbQuestionId, column.header, column.type],
              (err, result) => {
                if (err) {
                  reject(new DatabaseError('Failed to save table column', err));
                  return;
                }
                
                if (column.type === 'mcq' && column.choices) {
                  const values = column.choices.map(choice => [result.insertId, choice]);
                  db.query(
                    'INSERT INTO TableColumnChoices (column_id, choice_text) VALUES ?',
                    [values],
                    (err) => {
                      if (err) {
                        reject(new DatabaseError('Failed to save table column choices', err));
                        return;
                      }
                      resolve();
                    }
                  );
                } else {
                  resolve();
                }
              }
            );
          });
        }));
      }
      return Promise.resolve();
    }));
    
    // Commit transaction
    await new Promise((resolve, reject) => {
      db.commit((err) => {
        if (err) {
          console.error('Error committing transaction:', err);
          reject(new DatabaseError('Failed to commit transaction', err));
          return;
        }
        resolve();
      });
    });
    
    res.status(201).json({ message: 'Form saved successfully', formId });
  } catch (err) {
    // Rollback transaction on error
    await new Promise((resolve) => {
      db.rollback(() => resolve());
    });
    next(err);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      details: err.details
    });
  }
  
  if (err instanceof DatabaseError) {
    console.error('Database error details:', err.originalError);
  }
  
  if (process.env.NODE_ENV === 'production') {
    return res.status(err.statusCode || 500).json({
      status: 'error',
      message: 'Internal Server Error'
    });
  }
  
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
    stack: err.stack
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 