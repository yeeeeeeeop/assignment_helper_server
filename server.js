const express = require("express");
const cors = require("cors");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

let corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// mysql db 정보
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "0000",
  database: "classhelper",
});

// 회원가입
app.post("/api/signup", (req, res) => {
  const { id, password, name } = req.body;

  const sqlQuery = "INSERT INTO users (id, password, name) VALUES (?, ?, ?)";
  db.query(sqlQuery, [id, password, name], (err, result) => {
    if (err) {
      console.error("Error saving user:", err);
      res.status(500).json({ error: "Failed to save user" });
    } else {
      console.log("User saved successfully");
      res.status(200).json({ message: "User saved successfully" });
    }
  });
});

// 로그인
app.post("/api/login", async (req, res) => {
  const { id, password } = req.body;

  const sqlQuery = `SELECT * FROM users WHERE id = ? AND password = ?`;

  db.query(sqlQuery, [id, password], async (err, result) => {
    if (err) {
      console.error("Error retrieving user:", err);
      res.status(500).json({ error: "Failed to retrieve user" });
    } else {
      if (result.length === 0) {
        console.log("User not found");
        res.status(404).json({ message: "User not found" });
      } else {
        console.log("User logged in successfully");
        res.status(200).json({ message: "User logged in successfully" });
      }
    }
  });
});

// 완료된 과제 목록
app.get("/api/asg/completed", (req, res) => {
  const { userid } = req.query;
  const sqlQuery = `
  SELECT a.*, c.course_name
  FROM assignments a
  JOIN courses c ON a.course_id = c.course_id
  WHERE a.status = 'Y' AND a.user_id = ?`;

  db.query(sqlQuery, [userid], (err, result) => {
    res.send(result);
  });
});

// 미완료 과제 목록
app.get("/api/asg/incomplete", (req, res) => {
  const { userid } = req.query;
  const sqlQuery = `
  SELECT a.*, c.course_name
  FROM assignments a
  JOIN courses c ON a.course_id = c.course_id
  WHERE a.status = 'N' AND a.user_id = ?`;

  db.query(sqlQuery, [userid], (err, result) => {
    res.send(result);
  });
});

// 과제 작성
app.post("/api/asg/write", (req, res) => {
  const { course_id, title, content, deadline, status, userid } = req.body;

  const sqlQuery = `
    INSERT INTO assignments (course_id, title, content, deadline, status, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sqlQuery,
    [course_id, title, content, deadline, status, userid],
    (err, result) => {
      if (err) {
        console.error("Error adding assignment:", err);
        res.status(500).json({ error: "Failed to add assignment" });
      } else {
        res.status(200).json({ message: "Assignment added successfully" });
      }
    }
  );
});

// 과제 수정
app.patch("/api/asg/update/:asgId", (req, res) => {
  const { asgId } = req.params;
  console.log(asgId);
  const { title, content, deadline } = req.body;

  const sqlQuery = `
    UPDATE assignments
    SET title = ?, content = ?, deadline = ?
    WHERE asg_id = ?
  `;

  db.query(sqlQuery, [title, content, deadline, asgId], (err, result) => {
    if (err) {
      console.error("Error updating assignment:", err);
      res.status(500).json({ error: "Failed to update assignment" });
    } else {
      res.status(200).json({ message: "Assignment updated successfully" });
    }
  });
});

// 과제 삭제
app.delete("/api/asg/delete/:asgId", (req, res) => {
  const asgId = req.params.asgId;
  const sqlQuery = "DELETE FROM assignments WHERE asg_id = ?";
  db.query(sqlQuery, [asgId], (err, result) => {
    if (err) {
      console.error("Error deleting data:", err);
      res.status(500).send("Error deleting data");
    } else {
      res.send("Data deleted successfully");
    }
  });
});

// 과제 미완료처리
app.patch("/api/asg/completed/:asgId", (req, res) => {
  const asgId = req.params.asgId;

  const sqlQuery = "UPDATE assignments SET status = 'N' WHERE asg_id = ?";
  db.query(sqlQuery, [asgId], (err, result) => {
    if (err) {
      res.status(500).send("Error updating assignments status");
    } else {
      res.send("Assignments status updated successfully");
    }
  });
});

// 과제 완료 처리
app.patch("/api/asg/incomplete/:asgId", (req, res) => {
  const asgId = req.params.asgId;

  const sqlQuery = "UPDATE assignments SET status = 'Y' WHERE asg_id = ?";
  db.query(sqlQuery, [asgId], (err, result) => {
    if (err) {
      // 에러 처리
      res.status(500).send("Error updating assignment status");
    } else {
      res.send("Assignment status updated successfully");
    }
  });
});

// 전체 강의 목록 가져오기
app.get("/api/courses", (req, res) => {
  const sqlQuery = "SELECT * FROM courses";
  db.query(sqlQuery, (err, result) => {
    if (err) {
      console.error("Error retrieving courses: ", err);
      res.status(500).json({ error: "Failed to retrieve courses" });
    } else {
      res.status(200).json(result);
    }
  });
});

// 수강 강의 등록
app.post("/api/courses/enroll", (req, res) => {
  const { courseId, userId } = req.body;

  const sqlQuery =
    "INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)";
  db.query(sqlQuery, [userId, courseId], (err, result) => {
    if (err) {
      console.error("Error enrolling in course:", err);
      res.status(500).json({ error: "Failed to enroll in course" });
    } else {
      res.status(200).json({ message: "Enrollment successful" });
    }
  });
});

// 유저의 수강목록
app.get("/api/users/:userId/courses", (req, res) => {
  const { userId } = req.params;

  const sqlQuery = `
  SELECT c.course_id, c.course_num, c.course_class, c.course_name, c.professor, c.credit
  FROM courses c
  INNER JOIN user_courses uc ON c.course_id = uc.course_id
  WHERE uc.user_id = ?
  `;

  db.query(sqlQuery, [userId], (err, result) => {
    if (err) {
      console.error("Error retrieving user courses:", err);
      res.status(500).json({ error: "Failed to retrieve user courses" });
    } else {
      res.status(200).json(result);
    }
  });
});

// 과목 삭제
app.delete("/api/users/:userId/courses/:courseId", (req, res) => {
  const userId = req.params.userId;
  const courseId = req.params.courseId;

  const sqlQuery =
    "DELETE FROM user_courses WHERE user_id = ? AND course_id = ?";
  db.query(sqlQuery, [userId, courseId], (err, result) => {
    if (err) {
      console.error("Error deleting course:", err);
      res.status(500).json({ error: "Failed to delete course" });
    } else {
      res.status(200).json({ message: "Course successfully deleted" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`port num: ${PORT}`);
});
