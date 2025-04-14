-- Forms table
CREATE TABLE IF NOT EXISTS Forms (
    form_id INT AUTO_INCREMENT PRIMARY KEY,
    form_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table (parent table for all question types)
CREATE TABLE IF NOT EXISTS Questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    question_type ENUM('text', 'mcq', 'table') NOT NULL,
    question_text TEXT NOT NULL,
    FOREIGN KEY (form_id) REFERENCES Forms(form_id)
);

-- MCQ Choices table
CREATE TABLE IF NOT EXISTS MCQChoices (
    choice_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    choice_text TEXT NOT NULL,
    next_question_id INT,
    FOREIGN KEY (question_id) REFERENCES Questions(question_id),
    FOREIGN KEY (next_question_id) REFERENCES Questions(question_id)
);

-- Table Columns table
CREATE TABLE IF NOT EXISTS TableColumns (
    column_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    column_name VARCHAR(255) NOT NULL,
    column_type ENUM('text', 'mcq') NOT NULL,
    FOREIGN KEY (question_id) REFERENCES Questions(question_id)
);

-- Table Column Choices (for MCQ type columns)
CREATE TABLE IF NOT EXISTS TableColumnChoices (
    choice_id INT AUTO_INCREMENT PRIMARY KEY,
    column_id INT NOT NULL,
    choice_text TEXT NOT NULL,
    FOREIGN KEY (column_id) REFERENCES TableColumns(column_id)
);

-- Text Constraints table
CREATE TABLE IF NOT EXISTS TextConstraints (
    question_id INT PRIMARY KEY,
    min_length INT,
    max_length INT,
    FOREIGN KEY (question_id) REFERENCES Questions(question_id) ON DELETE CASCADE
);
